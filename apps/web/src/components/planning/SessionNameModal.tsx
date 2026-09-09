import { SetStateAction, useEffect, useState } from 'react';
import { PLANNING_NAME_MAX_LENGTH, RenamePlanningSessionDTO } from '@tbcm/common';
import { ModalWrapper } from '../Modal';
import { dtoValidator } from '../../utils/dto-validator';

interface SessionNameModalProps {
  isOpen: boolean;
  setIsOpen: (value: SetStateAction<boolean>) => void;
  currentName: string;
  onConfirm: (name: string) => void;
  onCancel?: () => void;
  onDiscard?: () => void;
  isLoading?: boolean;
  error?: string;
}

/**
 * Shown once, on the first successful auto-save of a draft created during this visit.
 * Confirming stores the chosen name; cancelling keeps the generated one. Either way the
 * planner's place in the wizard is unchanged (FR-008, FR-009, FR-010).
 */
export const SessionNameModal = ({
  isOpen,
  setIsOpen,
  currentName,
  onConfirm,
  onCancel,
  onDiscard,
  isLoading,
  error,
}: SessionNameModalProps) => {
  const [name, setName] = useState(currentName);
  const [validationError, setValidationError] = useState<string>();
  /**
   * The server-side error arrives as a prop, so it cannot be cleared directly. Suppress it
   * once the planner comes back to the field: the rejected name is no longer what is there.
   */
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);

  useEffect(() => {
    setName(currentName);
    setValidationError(undefined);
    setIsErrorDismissed(false);
  }, [currentName, isOpen]);

  const dismissMessage = () => {
    setValidationError(undefined);
    setIsErrorDismissed(true);
  };

  const handleConfirm = () => {
    // a fresh attempt must be able to surface the same message again
    setIsErrorDismissed(false);

    const trimmed = name.trim();
    const validationErrors = dtoValidator(RenamePlanningSessionDTO, { name: trimmed });

    if (validationErrors.name) {
      setValidationError(validationErrors.name);

      return;
    }

    setValidationError(undefined);
    onConfirm(trimmed);
  };

  const message = validationError ?? (isErrorDismissed ? undefined : error);

  return (
    <ModalWrapper
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      containerClassName='sm:max-w-[652px] sm:w-full rounded-[4px] shadow-[4px_7px_25px_rgba(0,0,0,0.05)]'
      title='Draft Saved Automatically'
      titleClassName='text-xl md:text-2xl font-bold text-bcBluePrimary'
      descriptionClassName='p-0 text-gray-700'
      headerRight={
        <button
          type='button'
          aria-label='Close draft naming modal'
          onClick={() => (onCancel ? onCancel() : setIsOpen(false))}
          className='text-2xl leading-none text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-bcBluePrimary focus:ring-offset-2'
        >
          ×
        </button>
      }
      description={
        <div className='flex flex-col gap-4 py-2'>
          <p className='text-sm md:text-base text-gray-600 leading-normal'>
            We&apos;ve saved your progress as a draft. Please name your draft before leaving this
            care plan.
          </p>
          <div className='pt-1'>
            <label htmlFor='session-name' className='block mb-1.5 text-sm font-bold text-gray-800'>
              Name
            </label>
            <input
              id='session-name'
              type='text'
              value={name}
              maxLength={PLANNING_NAME_MAX_LENGTH}
              aria-invalid={Boolean(message)}
              aria-describedby={message ? 'session-name-error' : undefined}
              onFocus={dismissMessage}
              onChange={event => {
                dismissMessage();
                setName(event.target.value);
              }}
              className='w-full border border-gray-300 rounded px-3 py-2 text-sm md:text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-bcBluePrimary focus:border-bcBluePrimary'
              placeholder='<default-name>'
            />
            {message && (
              <p id='session-name-error' role='alert' className='mt-1 text-sm text-red-600'>
                {message}
              </p>
            )}
          </div>
        </div>
      }
      closeButton={{
        title: 'Cancel',
        variant: 'secondary',
        classes: 'min-w-[112px]',
        onClick: () => (onCancel ? onCancel() : setIsOpen(false)),
      }}
      extraButton={
        onDiscard
          ? {
              title: 'Discard',
              variant: 'secondary',
              classes:
                'min-w-[112px] !border-none !shadow-none !bg-transparent !text-[#d8292f] hover:!text-[#a3181d]',
              isDisabled: isLoading,
              onClick: onDiscard,
            }
          : undefined
      }
      actionButton={{
        isLoading,
        title: 'Save',
        onClick: handleConfirm,
        isDisabled: !name.trim(),
        classes: 'min-w-[100px]',
      }}
    />
  );
};
