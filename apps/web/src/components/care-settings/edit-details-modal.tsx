/**
 * Edit Template Details Modal
 *
 * Renames a template and changes its level in a single save, so an
 * administrator does not have to make two round trips for what they think of
 * as one edit. The copy wizard reuses it for the first save, where the name and
 * the level are both still unset.
 */
import { SetStateAction, useEffect, useState } from 'react';
import { TemplateLevel } from '@tbcm/common';
import { ModalWrapper } from '../Modal';
import { RadioGroup } from '../Radio';
import { TEMPLATE_LEVEL_LEGEND, TEMPLATE_LEVEL_OPTIONS } from './template-level-options';

interface EditDetailsModalProps {
  isOpen: boolean;
  /** Overrides the default heading, e.g. for a copy that has no name yet. */
  title?: string;
  setIsOpen: (value: SetStateAction<boolean>) => void;
  currentName: string;
  currentLevel?: TemplateLevel | null;
  onConfirm: (details: { name: string; level: TemplateLevel }) => void;
  isLoading?: boolean;
  /** Field-level error, e.g. a duplicate-name 400 surfaced next to the input rather than as a toast. */
  nameError?: string;
}

export const EditDetailsModal: React.FC<EditDetailsModalProps> = ({
  isOpen,
  title,
  setIsOpen,
  currentName,
  currentLevel,
  onConfirm,
  isLoading,
  nameError,
}) => {
  const [name, setName] = useState(currentName);
  const [level, setLevel] = useState<TemplateLevel | undefined>(currentLevel ?? undefined);

  // Reset on each open so an abandoned edit is not silently resurrected the
  // next time the dialog is shown.
  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setLevel(currentLevel ?? undefined);
    }
  }, [isOpen, currentName, currentLevel]);

  const trimmedName = name.trim();
  const canSave = Boolean(trimmedName) && Boolean(level);

  return (
    <ModalWrapper
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title={title ?? `${currentName} Details`}
      headerRight={
        <button
          type='button'
          aria-label='Close Edit Details'
          className='text-gray-500 hover:text-gray-700 text-xl leading-none px-2'
          onClick={() => setIsOpen(false)}
        >
          &#10005;
        </button>
      }
      description={
        <div className='space-y-6'>
          <div>
            <label htmlFor='edit-details-name' className='block text-lg font-bold mb-4'>
              Care setting name
            </label>
            <input
              id='edit-details-name'
              type='text'
              value={name}
              onChange={e => setName(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bcBluePrimary focus:border-transparent'
              placeholder='Care setting name'
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? 'edit-details-name-error' : undefined}
            />
            {nameError && (
              <p id='edit-details-name-error' role='alert' className='mt-1 text-sm text-red-600'>
                {nameError}
              </p>
            )}
          </div>
          <RadioGroup
            name='edit-details-level'
            legend={TEMPLATE_LEVEL_LEGEND}
            className='text-base'
            legendClassName='text-lg'
            options={TEMPLATE_LEVEL_OPTIONS}
            value={level}
            onChange={value => setLevel(value as TemplateLevel)}
          />
        </div>
      }
      closeButton={{ title: 'Cancel' }}
      actionButton={{
        title: 'Save',
        isLoading,
        isDisabled: !canSave,
        onClick: () => canSave && level && onConfirm({ name: trimmedName, level }),
      }}
    />
  );
};
