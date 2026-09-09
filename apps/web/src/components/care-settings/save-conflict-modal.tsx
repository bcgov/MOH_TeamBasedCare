/**
 * Save Conflict Modal
 *
 * Shown when a save is rejected with `409` because someone else changed the
 * template first. Both choices destroy something, so the wording states the
 * consequence rather than relying on button labels alone.
 *
 * Dismissal keeps the unsaved work: nothing destructive should happen by
 * accident here.
 */
import { SetStateAction } from 'react';
import { ModalWrapper } from '../Modal';

interface SaveConflictModalProps {
  isOpen: boolean;
  setIsOpen: (value: SetStateAction<boolean>) => void;
  /** Human-readable "by {name} on {date}" fragment, when the 409 supplied one. */
  authorDescription?: string;
  onReload: () => void;
  onOverride: () => void;
  isLoading?: boolean;
}

export const SaveConflictModal: React.FC<SaveConflictModalProps> = ({
  isOpen,
  setIsOpen,
  authorDescription,
  onReload,
  onOverride,
  isLoading,
}) => {
  return (
    <ModalWrapper
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title='Template changed by someone else'
      description={
        <div className='space-y-3 text-sm text-gray-700'>
          <p>
            This template was changed {authorDescription ? `${authorDescription} ` : ''}since you
            opened it. <strong>Nothing has been saved yet.</strong>
          </p>
          <p>
            Choose <strong>Reload</strong> to discard your unsaved changes and load the latest
            version, or <strong>Override</strong> to save your changes over theirs.
          </p>
        </div>
      }
      closeButton={{ title: 'Reload', onClick: onReload }}
      actionButton={{ title: 'Override', isLoading, onClick: onOverride }}
    />
  );
};
