import { Radio } from '@components';
import { Form, Formik, useFormikContext } from 'formik';
import { usePlanningContent, usePlanningContext } from '../../services';
import { useCareSettingTemplatesForPlanning } from '../../services/useCareSettingTemplatesForPlanning';
import { PlanningSessionRO, ProfileOptions, SaveProfileDTO, formatDateTime } from '@tbcm/common';
import { SessionsTable } from './SessionsTable';
import { Button } from '../Button';
import { dtoValidator } from '../../utils/dto-validator';
import { RenderSelect } from '../generic/RenderSelect';
import { usePlanningProfile } from '../../services/usePlanningProfile';
import {
  PlanningSessionsFindState,
  usePlanningSessionsFind,
} from '../../services/usePlanningSessionsFind';
import { ModalWrapper } from '../Modal';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  drafts,
  lastDraft,
  isLoading: isLoadingPlanningProfile,
}: {
  drafts: PlanningSessionsFindState;
  lastDraft?: PlanningSessionRO;
  isLoading: boolean;
}) => {
  const { values, initialValues, setValues } = useFormikContext<ProfileFormProps>();
  const { careLocations, isValidating: isLoadingCareLocations } =
    useCareSettingTemplatesForPlanning();
  const [showModal, setShowModal] = useState(false);
  const {
    state: {
      profileOption: selectedProfileOption,
      sessionId: selectedSessionId,
      sessionName: selectedSessionName,
      sessionToName,
    },
    updateSessionId,
    updateSessionName,
    updateProfileOption,
  } = usePlanningContext();
  const previousProfileOption = useRef(values.profileOption);

  const handleScratch = useCallback(
    (changedToScratch: boolean) => {
      if (!sessionToName && selectedSessionId) {
        updateSessionId(); // reset session id
      }

      if (!sessionToName && selectedSessionName) {
        updateSessionName(''); // a new draft has no name yet
      }

      if (
        changedToScratch &&
        (values.profileOption !== ProfileOptions.FROM_SCRATCH || values.careLocation !== '')
      ) {
        // reset care location to default value
        setValues({
          profileOption: ProfileOptions.FROM_SCRATCH,
          careLocation: '',
        });
      }
    },
    [
      selectedSessionId,
      selectedSessionName,
      sessionToName,
      setValues,
      updateSessionId,
      updateSessionName,
      values.profileOption,
      values.careLocation,
    ],
  );

  // handle Loading state
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    setIsLoading(isLoadingPlanningProfile || isLoadingCareLocations);
  }, [isLoadingCareLocations, isLoadingPlanningProfile]);

  const hasSavedDrafts = drafts.unfilteredTotal > 0;

  useEffect(() => {
    if (hasSavedDrafts || drafts.isLoading || values.profileOption !== ProfileOptions.DRAFT) {
      return;
    }

    setValues({
      profileOption: ProfileOptions.FROM_SCRATCH,
      careLocation: '',
    });
  }, [drafts.isLoading, hasSavedDrafts, setValues, values.profileOption]);

  // handle profileOption change
  useEffect(() => {
    const previousOption = previousProfileOption.current;

    if (selectedProfileOption !== values.profileOption) {
      updateProfileOption(values.profileOption);
    }

    switch (values.profileOption) {
      case ProfileOptions.FROM_SCRATCH:
        handleScratch(previousOption !== ProfileOptions.FROM_SCRATCH);
        break;
      default:
        break;
    }

    previousProfileOption.current = values.profileOption;
  }, [handleScratch, selectedProfileOption, updateProfileOption, values.profileOption]);

  usePlanningContent();

  useEffect(() => {
    if (values?.careLocation && initialValues?.careLocation) {
      // if previous care location exists, but the value is not same as initial - show modal
      if (values.careLocation !== initialValues.careLocation) {
        setShowModal(true);
      }
    }
  }, [initialValues.careLocation, values.careLocation]);

  const profileOptions = useMemo(
    () => [
      {
        label: 'Start a new profile from scratch',
        value: ProfileOptions.FROM_SCRATCH,
      },
      {
        label: 'Continue working on a saved draft plan',
        hoverText: lastDraft?.updatedAt
          ? `Last saved - ${formatDateTime(lastDraft.updatedAt)}`
          : undefined,
        value: ProfileOptions.DRAFT,
        hidden: !hasSavedDrafts,
      },
      {
        label: 'Start from a generic profile',
        value: ProfileOptions.GENERIC,
        disabled: true,
      },
    ],
    [hasSavedDrafts, lastDraft],
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
            {values.profileOption !== ProfileOptions.GENERIC &&
              values.profileOption !== ProfileOptions.DRAFT &&
              !isLoading && (
                <div className='planning-form-box mt-4'>
                  <RenderSelect
                    label={'Select Care Setting'}
                    options={careLocations}
                    name='careLocation'
                  />
                </div>
              )}
          </div>
        </div>

        {values.profileOption !== ProfileOptions.FROM_SCRATCH &&
          values.profileOption !== ProfileOptions.GENERIC && <SessionsTable drafts={drafts} />}
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
  const drafts = usePlanningSessionsFind();

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

        <ProfileForm drafts={drafts} lastDraft={lastDraft} isLoading={isLoading} />
      </>
    </Formik>
  );
};
