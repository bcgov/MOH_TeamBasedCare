import { useState } from 'react';
import { SessionNameModal } from './SessionNameModal';
import { usePlanningContext } from '../../services/usePlanningContext';
import { usePlanningSessionMutations } from '../../services/usePlanningSessionMutations';

/**
 * Hosts the first-save naming modal outside the wizard content.
 *
 * The save that creates a draft also advances the planner to the next stage, which
 * unmounts the Profile stage. Rendering the prompt here keeps it on screen through that
 * transition, so confirming a name never depends on staying on the Profile stage.
 */
export const SessionNamePrompt = () => {
  const {
    state: { sessionToName },
    updateSessionName,
    clearSessionNamePrompt,
    refreshSessionsList,
  } = usePlanningContext();
  const { renamePlanningSession } = usePlanningSessionMutations();

  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  if (!sessionToName) return null;

  const onConfirm = async (name: string) => {
    setIsLoading(true);
    const result = await renamePlanningSession(sessionToName.id, name);
    setIsLoading(false);

    if (!result.ok) {
      setError(result.error);

      return;
    }

    updateSessionName(name);
    refreshSessionsList();
    setError(undefined);
    clearSessionNamePrompt();
  };

  const dismiss = () => {
    // Cancelling keeps the draft under its generated name
    setError(undefined);
    clearSessionNamePrompt();
  };

  return (
    <SessionNameModal
      isOpen
      setIsOpen={dismiss}
      currentName={sessionToName.name}
      isLoading={isLoading}
      error={error}
      onConfirm={onConfirm}
      onCancel={dismiss}
    />
  );
};
