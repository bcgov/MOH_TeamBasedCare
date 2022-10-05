import { useContext } from 'react';
import { PlanningContext, PlanningContextType } from '../components/planning';

export const usePlanningContext = () => {
  const {
    state,
    updateNextTriggered,
    updateProceedToNext,
    updateWaitForValidation,
    updateSessionId,
    updateShowModal,
    updateCanProceedToPrevious,
  } = useContext(PlanningContext) as PlanningContextType;

  return {
    updateNextTriggered: () => updateNextTriggered(),
    updateProceedToNext: () => updateProceedToNext(),
    updateWaitForValidation: () => updateWaitForValidation(),
    updateSessionId: (sessionId: string) => updateSessionId(sessionId),
    updateShowModal: (showModal: boolean) => updateShowModal(showModal),
    updateCanProceedToPrevious: (canProceedToPrevious: boolean) =>
      updateCanProceedToPrevious(canProceedToPrevious),

    state,
  };
};
