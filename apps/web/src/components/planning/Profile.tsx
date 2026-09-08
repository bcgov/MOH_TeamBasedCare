import { Radio } from '@components';
import { Form, Formik, useFormikContext } from 'formik';
import { usePlanningContent, usePlanningContext } from '../../services';
import { useCareSettingTemplatesForPlanning } from '../../services/useCareSettingTemplatesForPlanning';
import {
  PlanningSessionRO,
  ProfileOptions,
  SaveProfileDTO,
  formatDateFromNow,
  formatDateTime,
} from '@tbcm/common';
import { SessionsTable } from './SessionsTable';
import { Button } from '../Button';
import { dtoValidator } from '../../utils/dto-validator';
import { RenderSelect } from '../generic/RenderSelect';
import { usePlanningProfile } from '../../services/usePlanningProfile';
import { ModalWrapper } from '../Modal';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Spinner } from '../generic/Spinner';

export interface ProfileProps {
  step: number;
  title: string;
}

interface ProfileFormProps {
  profileOption: string;
  careLocation: string;
}

const ProfileForm = ({
  lastDraft,
  isLoading: isLoadingPlanningProfile,
}: {
  lastDraft?: PlanningSessionRO;
  isLoading: boolean;
}) => {
  const { values, initialValues, setValues } = useFormikContext<ProfileFormProps>();
  const { careLocations, isValidating: isLoadingCareLocations } =
    useCareSettingTemplatesForPlanning();
  const [showModal, setShowModal] = useState(false);
  const { updateSessionId, updateSessionName } = usePlanningContext();
  const [lastDraftUpdatedFromNow, setLastDraftUpdatedFromNow] = useState('');

  const handleLastDraft = useCallback(() => {
    if (!lastDraft) return;

    updateSessionId(lastDraft.id);
    // Keep the selected draft name available when the wizard advances.
    updateSessionName(lastDraft.name);

    setValues({
      profileOption: ProfileOptions.DRAFT,
      careLocation: lastDraft.careSetting.id,
    });
  }, [lastDraft]);

  const handleScratch = useCallback(() => {
    updateSessionId(); // reset session id
    updateSessionName(''); // a new draft has no name yet

    // reset care location to default value
    setValues({
      profileOption: ProfileOptions.FROM_SCRATCH,
      careLocation: '',
    });
  }, []);

  // handle Loading state
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    setIsLoading(isLoadingPlanningProfile || isLoadingCareLocations);
  }, [isLoadingCareLocations, isLoadingPlanningProfile]);

  // handle profileOption change
  useEffect(() => {
    switch (values.profileOption) {
      case ProfileOptions.FROM_SCRATCH:
        return handleScratch();
      case ProfileOptions.DRAFT:
        return handleLastDraft();
      default:
        return handleLastDraft();
    }
  }, [values.profileOption, lastDraft]);

  usePlanningContent();

  useEffect(() => {
    if (values?.careLocation && initialValues?.careLocation) {
      // if previous care location exists, but the value is not same as initial - show modal
      if (values.careLocation !== initialValues.careLocation) {
        setShowModal(true);
      }
    }
  }, [initialValues.careLocation, values.careLocation]);

  useEffect(() => {
    if (!lastDraft?.updatedAt) return;

    const updatedAt = lastDraft.updatedAt;

    const interval = () => {
      setLastDraftUpdatedFromNow(formatDateFromNow(updatedAt) || '');
    };

    interval(); // run immediately
    const intervalId = setInterval(interval, 10000); // re-evaluate every 10s

    return () => {
      clearInterval(intervalId);
    };
  }, [lastDraft?.updatedAt]);

  const profileOptions = useMemo(
    () => [
      {
        label: 'Start a new profile from scratch',
        value: ProfileOptions.FROM_SCRATCH,
      },
      {
        label: `Continue working on your last draft (Last saved ${lastDraftUpdatedFromNow})`,
        hoverText: `Last saved - ${formatDateTime(lastDraft?.updatedAt)}`,
        value: ProfileOptions.DRAFT,
        hidden: !lastDraft,
      },
      {
        label: 'Start from a generic profile',
        value: ProfileOptions.GENERIC,
        disabled: true,
      },
    ],
    [lastDraft, lastDraftUpdatedFromNow],
  );

  return (
    <Form className='w-full'>
      <div>
        <div className='planning-form-box'>
          <Radio
            legend='Select how do you want to start with'
            name='profileOption'
            options={profileOptions}
          />

          <div
            className='p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-200 dark:text-blue-800'
            role='alert'
          >
            <span className='font-bold'>This feature is currently under development</span>
          </div>
        </div>

        <div>
          <div>
            {isLoading && <Spinner show />}
            {values.profileOption !== ProfileOptions.GENERIC && !isLoading && (
              <div className='planning-form-box'>
                <RenderSelect
                  label={'Select Care Setting'}
                  options={careLocations}
                  name='careLocation'
                />
              </div>
            )}
          </div>
        </div>

        <SessionsTable />
      </div>

      <ModalWrapper
        isOpen={showModal}
        setIsOpen={setShowModal}
        title='Changing Care Setting?'
        description='Changing Care settings removes any previously selected care activities.'
        closeButton={{ title: 'Ok' }}
      />
    </Form>
  );
};

export const Profile: React.FC<ProfileProps> = () => {
  // The naming prompt is rendered by the wizard (SessionNamePrompt), not here: the save
  // that creates a draft also advances the stage, which would unmount this component.
  const { handleSubmit, initialValues, lastDraft, isLoading, hasFailedSave, retryFailedSave } =
    usePlanningProfile();

  return (
    <Formik
      initialValues={initialValues}
      validate={values => dtoValidator(SaveProfileDTO, values)}
      onSubmit={values => handleSubmit(values)}
      validateOnBlur={true}
      validateOnMount={true}
      enableReinitialize={true}
    >
      <>
        {/*
          A persistent banner, not a toast: it stays until a save succeeds or the planner
          leaves the stage, so a failed auto-save cannot go unnoticed (FR-005).
        */}
        {hasFailedSave && (
          <div
            role='alert'
            className='flex items-center justify-between gap-4 p-4 mb-4 text-sm text-red-800 bg-red-100 rounded-lg'
          >
            <span>Your progress could not be saved. Your latest changes are not stored yet.</span>
            <Button variant='outline' type='button' onClick={retryFailedSave}>
              Retry
            </Button>
          </div>
        )}

        <ProfileForm lastDraft={lastDraft} isLoading={isLoading} />
      </>
    </Formik>
  );
};
