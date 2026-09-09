import { createContext, useEffect, useReducer } from 'react';
import { ProfileOptions } from '@tbcm/common';
import { PlanningSteps } from '../../common/constants';

export interface PlanningContextStateProps {
  isNextTriggered: boolean;
  canProceedToNext: boolean;
  profileOption: string;
  sessionId: string;
  sessionName: string; // name of the draft currently open, shown beside the page title
  currentStep: number; // lifted out of PlanningWrapper so the sessions table can jump stages
  refetchActivityGap: boolean; // state to trigger re-render gap activity step
  /**
   * Monotonic counter bumped on every PROCEED_TO_NEXT. The advance effect keys off this
   * instead of `canProceedToNext` because a stage submits inside an awaited promise and
   * then immediately dispatches WAIT_FOR_VALIDATION; React batches the two updates, so the
   * boolean can go true -> false within a single render and the effect would never fire.
   */
  proceedToken: number;
  sessionsRefreshToken: number; // bumped when the drafts listing is known to be stale
  /**
   * The draft awaiting its first-save name. Held here, above the wizard content, so the
   * prompt survives the stage change that the same save triggers (FR-008..FR-010).
   */
  sessionToName: { id: string; name: string } | null;
}

const initialState: PlanningContextStateProps = {
  isNextTriggered: false,
  canProceedToNext: false,
  profileOption: ProfileOptions.FROM_SCRATCH,
  sessionId: '',
  sessionName: '',
  currentStep: 1,
  refetchActivityGap: false,
  proceedToken: 0,
  sessionsRefreshToken: 0,
  sessionToName: null,
};

export type PlanningContextType = {
  state: PlanningContextStateProps;
  updateNextTriggered: () => void;
  updateProceedToNext: () => void;
  updateWaitForValidation: () => void;
  updateProfileOption: (profileOption: string) => void;
  updateSessionId: (sessionId?: string) => void;
  updateSessionName: (sessionName: string) => void;
  updateCurrentStep: (currentStep: number) => void;
  updateRefetchActivityGap: (fetch: boolean) => void;
  refreshSessionsList: () => void;
  promptForSessionName: (session: { id: string; name: string }) => void;
  clearSessionNamePrompt: () => void;
};

const enum PlanningActions {
  NEXT_TRIGGERED = 'NEXT_TRIGGERED',
  PROCEED_TO_NEXT = 'PROCEED_TO_NEXT',
  WAIT_FOR_VALIDATION = 'WAIT_FOR_VALIDATION',
  UPDATE_PROFILE_OPTION = 'UPDATE_PROFILE_OPTION',
  UPDATE_SESSION_ID = 'UPDATE_SESSION_ID',
  UPDATE_SESSION_NAME = 'UPDATE_SESSION_NAME',
  UPDATE_CURRENT_STEP = 'UPDATE_CURRENT_STEP',
  REFETCH_ACTIVITY_GAP = 'REFETCH_ACTIVITY_GAP',
  REFRESH_SESSIONS = 'REFRESH_SESSIONS',
  PROMPT_SESSION_NAME = 'PROMPT_SESSION_NAME',
  CLEAR_SESSION_NAME_PROMPT = 'CLEAR_SESSION_NAME_PROMPT',
}

function reducer(state: any, action: any): PlanningContextStateProps {
  switch (action.type) {
    case PlanningActions.NEXT_TRIGGERED:
      return {
        ...state,
        isNextTriggered: true,
        canProceedToNext: false,
        refetchActivityGap: false,
      };
    case PlanningActions.PROCEED_TO_NEXT:
      return {
        ...state,
        isNextTriggered: false,
        canProceedToNext: true,
        refetchActivityGap: false,
        proceedToken: state.proceedToken + 1,
      };
    case PlanningActions.WAIT_FOR_VALIDATION:
      return {
        ...state,
        isNextTriggered: false,
        canProceedToNext: false,
        refetchActivityGap: false,
      };
    case PlanningActions.UPDATE_PROFILE_OPTION:
      if (state.profileOption === action?.payload?.profileOption) return state;

      return {
        ...state,
        profileOption: action?.payload?.profileOption ?? '',
      };
    case PlanningActions.UPDATE_SESSION_ID:
      return {
        ...state,
        ...action.payload,
      };
    case PlanningActions.UPDATE_SESSION_NAME:
      return {
        ...state,
        sessionName: action?.payload?.sessionName ?? '',
      };
    case PlanningActions.UPDATE_CURRENT_STEP:
      return {
        ...state,
        currentStep: action?.payload?.currentStep ?? 1,
        // a stage jump must not immediately re-trigger the advance effect
        isNextTriggered: false,
        canProceedToNext: false,
      };
    case PlanningActions.PROMPT_SESSION_NAME:
      return {
        ...state,
        sessionToName: action?.payload?.session ?? null,
      };
    case PlanningActions.CLEAR_SESSION_NAME_PROMPT:
      return {
        ...state,
        sessionToName: null,
      };
    case PlanningActions.REFRESH_SESSIONS:
      return {
        ...state,
        sessionsRefreshToken: state.sessionsRefreshToken + 1,
      };
    case PlanningActions.REFETCH_ACTIVITY_GAP:
      return {
        ...state,
        refetchActivityGap: action?.payload?.fetch ?? false,
      };
    default:
      return {
        ...state,
      };
  }
}

export const PlanningContext = createContext<PlanningContextType | null>(null);

export const PlanningProvider = ({ children }: { children: React.ReactElement }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const updateNextTriggered = () => dispatch({ type: PlanningActions.NEXT_TRIGGERED });
  const updateProceedToNext = () => dispatch({ type: PlanningActions.PROCEED_TO_NEXT });
  const updateWaitForValidation = () => dispatch({ type: PlanningActions.WAIT_FOR_VALIDATION });
  const updateProfileOption = (profileOption: string) =>
    dispatch({ type: PlanningActions.UPDATE_PROFILE_OPTION, payload: { profileOption } });
  const updateSessionId = (sessionId?: string) =>
    dispatch({ type: PlanningActions.UPDATE_SESSION_ID, payload: { sessionId } });
  const updateSessionName = (sessionName: string) =>
    dispatch({ type: PlanningActions.UPDATE_SESSION_NAME, payload: { sessionName } });
  const updateCurrentStep = (currentStep: number) =>
    dispatch({ type: PlanningActions.UPDATE_CURRENT_STEP, payload: { currentStep } });
  const updateRefetchActivityGap = (fetch: boolean) =>
    dispatch({ type: PlanningActions.REFETCH_ACTIVITY_GAP, payload: { fetch } });
  const refreshSessionsList = () => dispatch({ type: PlanningActions.REFRESH_SESSIONS });

  /**
   * Once per draft, not once per visit: the caller only fires this on a successful create,
   * so a resumed draft is never prompted, but every new draft made in the same visit is
   * (FR-011, FR-012).
   */
  const promptForSessionName = (session: { id: string; name: string }) =>
    dispatch({ type: PlanningActions.PROMPT_SESSION_NAME, payload: { session } });
  const clearSessionNamePrompt = () =>
    dispatch({ type: PlanningActions.CLEAR_SESSION_NAME_PROMPT });

  /**
   * Advance the wizard when the active stage reports it can proceed. This lived in
   * PlanningWrapper while currentStep was local state; it moves here unchanged.
   */
  useEffect(() => {
    if (state.proceedToken === 0) return;
    if (state.currentStep >= PlanningSteps.length) return;

    dispatch({
      type: PlanningActions.UPDATE_CURRENT_STEP,
      payload: { currentStep: state.currentStep + 1 },
    });
  }, [state.proceedToken]);

  return (
    <PlanningContext.Provider
      value={{
        state,
        updateNextTriggered,
        updateProceedToNext,
        updateWaitForValidation,
        updateProfileOption,
        updateSessionId,
        updateSessionName,
        updateCurrentStep,
        updateRefetchActivityGap,
        refreshSessionsList,
        promptForSessionName,
        clearSessionNamePrompt,
      }}
    >
      {children}
    </PlanningContext.Provider>
  );
};
