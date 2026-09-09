import { useEffect, useState } from 'react';
import { SessionNameModal } from './SessionNameModal';
import { ModalWrapper } from '../Modal';
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
    updateSessionId,
    updateCurrentStep,
    clearSessionNamePrompt,
    refreshSessionsList,
  } = usePlanningContext();
  const { renamePlanningSession, discardPlanningSession } = usePlanningSessionMutations();

  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  // This component stays mounted across prompts, so a leftover confirm dialog from a
  // previous draft must not carry over onto the next one.
  useEffect(() => {
    setIsDiscardConfirmOpen(false);
  }, [sessionToName?.id]);

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

  const onConfirmDiscard = async () => {
    setIsDiscarding(true);
    const result = await discardPlanningSession(sessionToName.id);
    setIsDiscarding(false);
    setIsDiscardConfirmOpen(false);

    if (!result.ok && !result.gone) return;

    // The draft being named is discarded — return the wizard to the Profile stage
    setError(undefined);
    clearSessionNamePrompt();
    updateSessionId();
    updateSessionName('');
    updateCurrentStep(1);
    refreshSessionsList();
  };

  return (
    <>
      <SessionNameModal
        isOpen={!isDiscardConfirmOpen}
        setIsOpen={dismiss}
        currentName={sessionToName.name}
        isLoading={isLoading}
        error={error}
        onConfirm={onConfirm}
        onCancel={dismiss}
        onDiscard={() => setIsDiscardConfirmOpen(true)}
      />

      {isDiscardConfirmOpen && (
        <ModalWrapper
          isOpen={isDiscardConfirmOpen}
          setIsOpen={() => setIsDiscardConfirmOpen(false)}
          containerClassName='sm:max-w-[652px] sm:w-full rounded-[4px] shadow-[4px_7px_25px_rgba(0,0,0,0.05)]'
          title='Delete Draft Care Plan?'
          titleClassName='text-xl md:text-2xl font-bold text-bcBluePrimary'
          descriptionClassName='p-0 text-gray-700'
          headerRight={
            <button
              type='button'
              aria-label='Close dialog'
              onClick={() => setIsDiscardConfirmOpen(false)}
              disabled={isDiscarding}
              className='text-3xl leading-none text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-bcBluePrimary focus:ring-offset-2 disabled:opacity-50'
            >
              ×
            </button>
          }
          description={
            <p className='py-2 text-sm md:text-base text-gray-600 leading-normal'>
              This draft will be permanently deleted and cannot be recovered. Any unsaved planning
              work associated with this draft will be lost.
            </p>
          }
          closeButton={{
            title: 'Cancel',
            variant: 'secondary',
            isDisabled: isDiscarding,
            onClick: () => setIsDiscardConfirmOpen(false),
            classes: 'min-w-[112px]',
          }}
          actionButton={{
            title: 'Delete Draft',
            isLoading: isDiscarding,
            isError: true,
            onClick: onConfirmDiscard,
            classes: 'min-w-[156px]',
          }}
        />
      )}
    </>
  );
};
