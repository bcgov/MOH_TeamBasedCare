/**
 * Save Confirm Modal Component
 *
 * Simple confirmation modal for saving changes in edit mode.
 * Unlike SaveNameModal, this does not allow name changes.
 */
import { SetStateAction } from 'react';
import { ModalWrapper } from '../Modal';

interface SaveConfirmModalProps {
  isOpen: boolean;
  setIsOpen: (value: SetStateAction<boolean>) => void;
  templateName: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const SaveConfirmModal: React.FC<SaveConfirmModalProps> = ({
  isOpen,
  setIsOpen,
  templateName,
  onConfirm,
  isLoading,
}) => {
  return (
    <ModalWrapper
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title='Save Changes'
      description={<p>Are you sure you want to save changes to &quot;{templateName}&quot;?</p>}
      closeButton={{ title: 'Cancel' }}
      actionButton={{
        isLoading,
        title: 'Confirm',
        onClick: onConfirm,
      }}
    />
  );
};
