/**
 * Save Name Modal Component
 *
 * Confirmation modal for saving a care setting template.
 * Allows the user to review/edit the template name before saving.
 *
 * Features:
 * - Pre-populated with current template name
 * - Validation: save button disabled if name is empty
 * - Loading state during save operation
 */
import { useState, useEffect, SetStateAction } from 'react';
import { ModalWrapper } from '../Modal';

interface SaveNameModalProps {
  isOpen: boolean;
  setIsOpen: (value: SetStateAction<boolean>) => void;
  currentName: string;
  onConfirm: (name: string) => void;
  isLoading?: boolean;
}

export const SaveNameModal: React.FC<SaveNameModalProps> = ({
  isOpen,
  setIsOpen,
  currentName,
  onConfirm,
  isLoading,
}) => {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name.trim());
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title='Save Care Setting'
      description={
        <div className='space-y-4'>
          <div>
            <label htmlFor='save-name' className='block text-sm font-medium text-gray-700 mb-1'>
              Care Setting Name
            </label>
            <input
              id='save-name'
              type='text'
              value={name}
              onChange={e => setName(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bcBluePrimary focus:border-transparent'
              placeholder='Enter name for the care setting'
            />
          </div>
        </div>
      }
      closeButton={{ title: 'Cancel' }}
      actionButton={{
        isLoading,
        title: 'Save',
        onClick: handleConfirm,
        isDisabled: !name.trim(),
      }}
    />
  );
};
