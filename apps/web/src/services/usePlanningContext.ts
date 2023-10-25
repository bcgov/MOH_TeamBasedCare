import { useContext } from 'react';
import { PlanningContext, PlanningContextType } from '../components/planning';

export const usePlanningContext = () => {
  const {
    state,
    updateNextTriggered,
    updateProceedToNext,
    updateWaitForValidation,
    updateSessionId,
    updateRefetchActivityGap,
  } = useContext(PlanningContext) as PlanningContextType;

  return {
    updateNextTriggered: () => updateNextTriggered(),
    updateProceedToNext: () => updateProceedToNext(),
    updateWaitForValidation: () => updateWaitForValidation(),
    updateSessionId: (sessionId: string) => updateSessionId(sessionId),
    updateRefetchActivityGap: (fetch: boolean) => updateRefetchActivityGap(fetch),
    state,
  };
};
