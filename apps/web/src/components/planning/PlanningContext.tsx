import { createContext, useReducer } from 'react';

export interface PlanningContextStateProps {
  isNextTriggered: boolean;
  canProceedToNext: boolean;
  sessionId: string;
  disableNextButton: boolean;
}

const initialState: PlanningContextStateProps = {
  isNextTriggered: false,
  canProceedToNext: false,
  sessionId: '',
  disableNextButton: true,
};

export type PlanningContextType = {
  state: PlanningContextStateProps;
  updateNextTriggered: () => void;
  updateProceedToNext: () => void;
  updateWaitForValidation: () => void;
  updateSessionId: (sessionId: string) => void;
  updateDisableNextButton: () => void;
};

const enum PlanningActions {
  NEXT_TRIGGERED = 'NEXT_TRIGGERED',
  PROCEED_TO_NEXT = 'PROCEED_TO_NEXT',
  WAIT_FOR_VALIDATION = 'WAIT_FOR_VALIDATION',
  UPDATE_SESSION_ID = 'UPDATE_SESSION_ID',
  DISABLENEXTBUTTON = 'DISABLENEXTBUTTON',
}

function reducer(state: any, action: any): PlanningContextStateProps {
  switch (action.type) {
    case PlanningActions.NEXT_TRIGGERED:
      return {
        ...state,
        isNextTriggered: true,
        canProceedToNext: false,
      };
    case PlanningActions.PROCEED_TO_NEXT:
      return {
        ...state,
        isNextTriggered: false,
        canProceedToNext: true,
      };
    case PlanningActions.WAIT_FOR_VALIDATION:
      return {
        ...state,
        isNextTriggered: false,
        canProceedToNext: false,
      };
    case PlanningActions.DISABLENEXTBUTTON:
      return {
        ...state,
        disableNextButton: false,
      };
    case PlanningActions.UPDATE_SESSION_ID:
      return {
        ...state,
        ...action.payload,
      };
    default:
      return {
        ...state,
      };
  }
}

export const PlanningContext = createContext<PlanningContextType | null>(null);

export const PlanningProvider = ({ children }: any) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const updateNextTriggered = () => dispatch({ type: PlanningActions.NEXT_TRIGGERED });
  const updateProceedToNext = () => dispatch({ type: PlanningActions.PROCEED_TO_NEXT });
  const updateWaitForValidation = () => dispatch({ type: PlanningActions.WAIT_FOR_VALIDATION });
  const updateDisableNextButton = () => dispatch({ type: PlanningActions.DISABLENEXTBUTTON });
  const updateSessionId = (sessionId: string) =>
    dispatch({ type: PlanningActions.UPDATE_SESSION_ID, payload: { sessionId } });

  return (
    <PlanningContext.Provider
      value={{
        state,
        updateNextTriggered,
        updateProceedToNext,
        updateWaitForValidation,
        updateSessionId,
        updateDisableNextButton,
      }}
    >
      {children}
    </PlanningContext.Provider>
  );
};
