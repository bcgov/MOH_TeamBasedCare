/**
 * Limits and Conditions Modal
 *
 * Captures the health-authority-specific restriction behind an `LC` permission.
 * A permission carries exactly one limit, so the picker is single-select.
 *
 * Cancelling reverts the cell to whatever it was before `LC` was chosen, which
 * is why the caller supplies `onCancel` rather than the dialog just closing:
 * an `LC` cell with no limit is not a state we want to create.
 */
import { SetStateAction, useState } from 'react';
import { LimitConditionRO } from '@tbcm/common';
import { ModalWrapper } from '../Modal';
import { BasicSelect } from '../Select';
import { Label } from '../Label';

export interface PermissionLimitValue {
  limitId: string;
  restrictionDescription?: string;
}

interface LimitsConditionsModalProps {
  isOpen: boolean;
  setIsOpen: (value: SetStateAction<boolean>) => void;
  limits: LimitConditionRO[];
  /** Names the activity/occupation pair being edited so the dialog is not ambiguous. */
  activityName?: string;
  occupationName?: string;
  initialValue?: PermissionLimitValue;
  onConfirm: (value: PermissionLimitValue) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const RESTRICTION_MAX_LENGTH = 2000;
const PLACEHOLDER = 'List of Limits and conditions';

export const LimitsConditionsModal: React.FC<LimitsConditionsModalProps> = ({
  isOpen,
  setIsOpen,
  limits,
  activityName,
  occupationName,
  initialValue,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  // Seeded at mount rather than in an effect: the shared list component reads
  // its value once on first render, so a value applied afterwards would never
  // reach it and a reopened cell would show an empty dropdown.
  const [limitId, setLimitId] = useState<string>(initialValue?.limitId ?? '');
  const [restrictionDescription, setRestrictionDescription] = useState(
    initialValue?.restrictionDescription ?? '',
  );

  const options = [
    { value: '', label: PLACEHOLDER, disabled: true },
    ...limits.map(limit => ({ value: limit.id, label: limit.name })),
  ];

  const handleCancel = () => {
    onCancel();
    setIsOpen(false);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title='Limits and Conditions'
      headerRight={
        <button
          type='button'
          aria-label='Close Limits and Conditions'
          className='text-gray-500 hover:text-gray-700 text-xl leading-none px-2'
          onClick={handleCancel}
        >
          &#10005;
        </button>
      }
      description={
        <div className='space-y-4'>
          {(activityName || occupationName) && (
            <div className='text-base font-bold text-gray-900'>
              {activityName && <p>{activityName}</p>}
              {occupationName && <p>{occupationName}</p>}
            </div>
          )}
          <p className='text-sm text-gray-700'>
            Describe the Health Authority-specific restriction, condition, certification, or local
            requirement that applies to this activity.
          </p>

          <div>
            <BasicSelect<string>
              id='limits-conditions-list'
              label='Limits and Conditions list'
              options={options}
              value={limitId}
              buttonClassName={limitId ? undefined : 'text-gray-500'}
              onChange={value => setLimitId(value ?? '')}
            />
          </div>

          <div>
            <div className='mb-2'>
              <Label htmlFor='restriction-description'>Restriction Description (Optional)</Label>
            </div>
            <textarea
              id='restriction-description'
              value={restrictionDescription}
              maxLength={RESTRICTION_MAX_LENGTH}
              onChange={e => setRestrictionDescription(e.target.value)}
              placeholder='Describe the restriction, condition, training requirement, or local policy that applies.'
              className='bg-white h-[150px] w-full border rounded border-bcGray p-1.5'
            />
          </div>
        </div>
      }
      closeButton={{ title: 'Cancel', onClick: handleCancel }}
      actionButton={{
        title: 'Save',
        isLoading,
        isDisabled: !limitId,
        onClick: () =>
          limitId &&
          onConfirm({
            limitId,
            restrictionDescription: restrictionDescription.trim() || undefined,
          }),
      }}
    />
  );
};
