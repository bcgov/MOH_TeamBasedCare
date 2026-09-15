import { useContext } from 'react';
import { PlanningContext, PlanningContextType } from '../components/planning';

export const usePlanningContext = () => {
  const {
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
    beginLeaveSave,
  } = useContext(PlanningContext) as PlanningContextType;

  return {
    updateNextTriggered: () => updateNextTriggered(),
    updateProceedToNext: () => updateProceedToNext(),
    updateWaitForValidation: () => updateWaitForValidation(),
    updateProfileOption: (profileOption: string) => updateProfileOption(profileOption),
    updateSessionId: (sessionId?: string) => updateSessionId(sessionId),
    updateSessionName: (sessionName: string) => updateSessionName(sessionName),
    updateCurrentStep: (currentStep: number) => updateCurrentStep(currentStep),
    updateRefetchActivityGap: (fetch: boolean) => updateRefetchActivityGap(fetch),
    refreshSessionsList: () => refreshSessionsList(),
    promptForSessionName: (session: { id: string; name: string }) => promptForSessionName(session),
    clearSessionNamePrompt: () => clearSessionNamePrompt(),
    // Passed through rather than re-wrapped: the leave-save listener depends on it, and a
    // fresh identity each render would tear down and re-register that listener.
    beginLeaveSave,
    state,
  };
};
