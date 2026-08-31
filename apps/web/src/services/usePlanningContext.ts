import { useContext } from 'react';
import { PlanningContext, PlanningContextType } from '../components/planning';

export const usePlanningContext = () => {
  const {
    state,
    updateNextTriggered,
    updateProceedToNext,
    updateWaitForValidation,
    updateSessionId,
    updateSessionName,
    updateCurrentStep,
    updateRefetchActivityGap,
    refreshSessionsList,
    promptForSessionName,
    clearSessionNamePrompt,
  } = useContext(PlanningContext) as PlanningContextType;

  return {
    updateNextTriggered: () => updateNextTriggered(),
    updateProceedToNext: () => updateProceedToNext(),
    updateWaitForValidation: () => updateWaitForValidation(),
    updateSessionId: (sessionId?: string) => updateSessionId(sessionId),
    updateSessionName: (sessionName: string) => updateSessionName(sessionName),
    updateCurrentStep: (currentStep: number) => updateCurrentStep(currentStep),
    updateRefetchActivityGap: (fetch: boolean) => updateRefetchActivityGap(fetch),
    refreshSessionsList: () => refreshSessionsList(),
    promptForSessionName: (session: { id: string; name: string }) => promptForSessionName(session),
    clearSessionNamePrompt: () => clearSessionNamePrompt(),
    state,
  };
};
