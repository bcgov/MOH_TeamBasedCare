/* eslint-disable @typescript-eslint/no-explicit-any */
import { Radio } from '@components';
import { Form, Formik, useFormikContext } from 'formik';
import { useCareLocations, usePlanningContent } from '../../services';
import { SaveProfileDTO } from '@tbcm/common';
import createValidator from 'class-validator-formik';
import { RenderSelect } from '../generic/RenderSelect';
import { usePlanningProfile } from '../../services/usePlanningProfile';
import { ModalWrapper } from '../Modal';
import { useEffect, useState } from 'react';

export interface ProfileProps {
  step: number;
  title: string;
}

export const enum ProfileOptions {
  GENERIC = 'generic',
  FROM_SCRATCH = 'scratch',
}

interface ProfileFormProps {
  profileOption: string;
  careLocation: string;
}

export const profileOptions = [
  {
    label: 'Start a new profile from scratch',
    value: ProfileOptions.FROM_SCRATCH,
    selected: false,
  },
  {
    label: 'Start from a generic profile',
    value: ProfileOptions.GENERIC,
    selected: false,
    disabled: true,
  },
];

const ProfileForm = () => {
  const { values, initialValues } = useFormikContext<ProfileFormProps>();
  const { careLocations, isLoading } = useCareLocations();
  const [showModal, setShowModal] = useState(false);

  usePlanningContent();

  useEffect(() => {
    if (values?.careLocation) {
      // if previous care location exists, but the value is not same as initial - show modal
      if (values.careLocation !== initialValues.careLocation) {
        setShowModal(true);
      }
    }
  }, [initialValues.careLocation, values.careLocation]);

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
            {values.profileOption === ProfileOptions.FROM_SCRATCH && !isLoading && (
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
        title='Changing Care Location?'
        description='Changing Care Locations removes any selected care activities.'
      />
    </Form>
  );
};

export const Profile: React.FC<ProfileProps> = () => {
  const profileValidationSchema = createValidator(SaveProfileDTO);
  const { handleSubmit, initialValues } = usePlanningProfile();
  return (
    <Formik
      initialValues={initialValues}
      validate={profileValidationSchema}
      onSubmit={handleSubmit}
      validateOnBlur={true}
      validateOnMount={true}
      enableReinitialize={true}
    >
      <ProfileForm />
    </Formik>
  );
};
