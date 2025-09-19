import { createContext, useReducer } from 'react';

export interface PlanningContextStateProps {
  isNextTriggered: boolean;
  canProceedToNext: boolean;
  sessionId: string;
  refetchActivityGap: boolean; // state to trigger re-render gap activity step
}

const initialState: PlanningContextStateProps = {
  isNextTriggered: false,
  canProceedToNext: false,
  sessionId: '',
  refetchActivityGap: false,
};

export type PlanningContextType = {
  state: PlanningContextStateProps;
  updateNextTriggered: () => void;
  updateProceedToNext: () => void;
  updateWaitForValidation: () => void;
  updateSessionId: (sessionId?: string) => void;
  updateRefetchActivityGap: (fetch: boolean) => void;
};

const enum PlanningActions {
  NEXT_TRIGGERED = 'NEXT_TRIGGERED',
  PROCEED_TO_NEXT = 'PROCEED_TO_NEXT',
  WAIT_FOR_VALIDATION = 'WAIT_FOR_VALIDATION',
  UPDATE_SESSION_ID = 'UPDATE_SESSION_ID',
  REFETCH_ACTIVITY_GAP = 'REFETCH_ACTIVITY_GAP',
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
      };
    case PlanningActions.WAIT_FOR_VALIDATION:
      return {
        ...state,
        isNextTriggered: false,
        canProceedToNext: false,
        refetchActivityGap: false,
      };
    case PlanningActions.UPDATE_SESSION_ID:
      return {
        ...state,
        ...action.payload,
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
  const updateSessionId = (sessionId?: string) =>
    dispatch({ type: PlanningActions.UPDATE_SESSION_ID, payload: { sessionId } });
  const updateRefetchActivityGap = (fetch: boolean) =>
    dispatch({ type: PlanningActions.REFETCH_ACTIVITY_GAP, payload: { fetch } });

  return (
    <PlanningContext.Provider
      value={{
        state,
        updateNextTriggered,
        updateProceedToNext,
        updateWaitForValidation,
        updateSessionId,
        updateRefetchActivityGap,
      }}
    >
      {children}
    </PlanningContext.Provider>
  );
};
