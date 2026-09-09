import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { PLANNING_NAME_MAX_LENGTH, RenamePlanningSessionDTO } from '@tbcm/common';
import { dtoValidator } from '../../utils/dto-validator';
import { usePlanningSessionMutations } from '../../services/usePlanningSessionMutations';
import { ModalWrapper } from '../Modal';

export interface SessionNameRenameControlProps {
  sessionId: string;
  name: string;
  onRenamed?: (name: string) => void;
  className?: string;
}

export const SessionNameRenameControl = ({
  sessionId,
  name,
  onRenamed,
  className = '',
}: SessionNameRenameControlProps) => {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [error, setError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const displayRef = useRef<HTMLButtonElement | null>(null);

  const { renamePlanningSession } = usePlanningSessionMutations();

  useEffect(() => {
    if (!isRenameDialogOpen) return;

    setDraftName(name);
    setError(undefined);
    window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    // `name` is intentionally excluded: re-syncing on every parent refresh would
    // discard what the planner has typed.
  }, [isRenameDialogOpen]);

  const openRenameDialog = () => {
    setIsRenameDialogOpen(true);
  };

  const closeRenameDialog = () => {
    setIsRenameDialogOpen(false);
    setError(undefined);
    setDraftName(name);
    displayRef.current?.focus();
  };

  const saveRename = async () => {
    const trimmed = draftName.trim();

    // Validate locally first so a length error needs no round trip
    const validationErrors = dtoValidator(RenamePlanningSessionDTO, { name: trimmed });

    if (validationErrors.name) {
      setError(validationErrors.name);

      return;
    }

    if (trimmed === name) {
      setIsRenameDialogOpen(false);

      return;
    }

    setIsSaving(true);
    const result = await renamePlanningSession(sessionId, trimmed);
    setIsSaving(false);

    if (!result.ok) {
      // Keep the dialog open with the planner's text intact so it can be corrected
      setError(result.error);

      return;
    }

    onRenamed?.(trimmed);
    setIsRenameDialogOpen(false);
    toast.success('Changes saved automatically.');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveRename();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeRenameDialog();
    }
  };

  const dialog = isRenameDialogOpen ? (
    <ModalWrapper
      isOpen={isRenameDialogOpen}
      setIsOpen={closeRenameDialog}
      containerClassName='sm:max-w-[652px] sm:w-full rounded-[4px] shadow-[4px_7px_25px_rgba(0,0,0,0.05)]'
      title='Rename'
      titleClassName='text-xl md:text-2xl font-bold text-bcBluePrimary'
      descriptionClassName='p-0 text-gray-700'
      headerRight={
        <button
          type='button'
          aria-label='Close dialog'
          onClick={closeRenameDialog}
          disabled={isSaving}
          className='text-3xl leading-none text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-bcBluePrimary focus:ring-offset-2 disabled:opacity-50'
        >
          ×
        </button>
      }
      description={
        <div className='flex flex-col gap-4 py-2'>
          <p className='text-sm md:text-base text-gray-600 leading-normal'>
            Rename Care plan draft
          </p>
          <div className='pt-1'>
            <label
              htmlFor={`rename-session-name-${sessionId}`}
              className='block mb-1.5 text-sm font-bold text-gray-800'
            >
              Name
            </label>
            <input
              ref={inputRef}
              id={`rename-session-name-${sessionId}`}
              type='text'
              value={draftName}
              disabled={isSaving}
              maxLength={PLANNING_NAME_MAX_LENGTH}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `rename-session-name-error-${sessionId}` : undefined}
              onFocus={() => setError(undefined)}
              onChange={event => {
                setError(undefined);
                setDraftName(event.target.value);
              }}
              onKeyDown={handleKeyDown}
              className='w-full border border-gray-400 rounded px-3 py-2 text-sm md:text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-bcBluePrimary focus:border-bcBluePrimary'
            />
            {error && (
              <p
                id={`rename-session-name-error-${sessionId}`}
                role='alert'
                className='mt-1 text-sm text-red-600'
              >
                {error}
              </p>
            )}
          </div>
        </div>
      }
      closeButton={{
        title: 'Cancel',
        variant: 'secondary',
        isDisabled: isSaving,
        onClick: closeRenameDialog,
        classes: 'min-w-[112px]',
      }}
      actionButton={{
        isLoading: isSaving,
        title: 'Save',
        onClick: saveRename,
        isDisabled: !draftName.trim(),
        classes: 'min-w-[100px]',
      }}
    />
  ) : null;

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <h1 className='text-[36px] font-bold text-gray-800 truncate'>{name}</h1>
      <button
        ref={displayRef}
        type='button'
        onClick={openRenameDialog}
        className='shrink-0 h-8 rounded border border-gray-400 bg-white px-4 text-sm font-bold shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-bcBluePrimary focus:ring-offset-2'
      >
        Rename
      </button>
      {dialog}
    </div>
  );
};
