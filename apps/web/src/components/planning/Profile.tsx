/* eslint-disable @typescript-eslint/no-explicit-any */
import { Radio } from '@components';
import { Form, Formik, useFormikContext } from 'formik';
import { useCareLocations, usePlanningContent, usePlanningContext } from '../../services';
import {
  PlanningSessionRO,
  ProfileOptions,
  SaveProfileDTO,
  formatDateFromNow,
  formatDateTime,
} from '@tbcm/common';
import createValidator from 'class-validator-formik';
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

const ProfileForm = ({ lastDraft }: { lastDraft?: PlanningSessionRO }) => {
  const { values, initialValues, setValues } = useFormikContext<ProfileFormProps>();
  const { careLocations, isLoading } = useCareLocations();
  const [showModal, setShowModal] = useState(false);
  const { updateSessionId } = usePlanningContext();

  const handleLastDraft = useCallback(() => {
    if (!lastDraft) return;

    updateSessionId(lastDraft.id);

    setValues({
      profileOption: ProfileOptions.DRAFT,
      careLocation: lastDraft.careLocationId || '',
    });
  }, [lastDraft]);

  const handleScratch = useCallback(() => {
    updateSessionId(); // reset session id

    // reset care location to default value
    setValues({
      profileOption: ProfileOptions.FROM_SCRATCH,
      careLocation: '',
    });
  }, []);

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

  const profileOptions = useMemo(
    () => [
      {
        label: 'Start a new profile from scratch',
        value: ProfileOptions.FROM_SCRATCH,
      },
      {
        label: `Continue working on your last draft (Last saved ${formatDateFromNow(
          lastDraft?.updatedAt,
        )})`,
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
    [lastDraft],
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
      </div>

      <ModalWrapper
        isOpen={showModal}
        setIsOpen={setShowModal}
        title='Changing Care Setting?'
        description='Changing Care settings removes any previously selected care activities.'
      />
    </Form>
  );
};

export const Profile: React.FC<ProfileProps> = () => {
  const profileValidationSchema = createValidator(SaveProfileDTO);
  const { handleSubmit, initialValues, lastDraft } = usePlanningProfile();
  return (
    <Formik
      initialValues={initialValues}
      validate={profileValidationSchema}
      onSubmit={handleSubmit}
      validateOnBlur={true}
      validateOnMount={true}
      enableReinitialize={true}
    >
      <ProfileForm lastDraft={lastDraft} />
    </Formik>
  );
};
