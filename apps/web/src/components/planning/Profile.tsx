/* eslint-disable @typescript-eslint/no-explicit-any */
import { Radio } from '@components';
import { Form, Formik, useFormikContext } from 'formik';
import { useCareLocations, usePlanningContext } from '../../services';
import { SaveProfileDTO } from '@tbcm/common';
import createValidator from 'class-validator-formik';
import { useEffect } from 'react';
import { RenderSelect } from '../generic/RenderSelect';
import { usePlanningProfile } from '../../services/usePlanningProfile';

export interface ProfileProps {
  step: number;
  title: string;
}

export const enum ProfileOptions {
  GENERIC = 'generic',
  FROM_SCRATCH = 'scratch',
}

interface ProfileFormProps {
  profile: string;
  careLocation: string;
}

export const profileOptions = [
  {
    label: 'Start from a generic profile',
    value: ProfileOptions.GENERIC,
    selected: false,
  },
  {
    label: 'Start a new profile from scratch',
    value: ProfileOptions.FROM_SCRATCH,
    selected: false,
  },
];

const ProfileForm = () => {
  const { isSubmitting, values, submitForm, isValid } = useFormikContext<ProfileFormProps>();

  const { careLocations, isLoading } = useCareLocations();
  const {
    state: { isNextTriggered },
    updateWaitForValidation,
  } = usePlanningContext();

  useEffect(() => {
    (async () => {
      if (isNextTriggered && !isSubmitting) {
        try {
          await submitForm();
          !isValid && updateWaitForValidation();
        } catch (error: any) {
          updateWaitForValidation();
        }
      }
    })();
  }, [isNextTriggered]);

  return (
    <Form className='w-full'>
      <div>
        <div className='planning-form-box'>
          <Radio
            legend='Select how do you want to start with'
            name='profile'
            options={profileOptions}
          />
        </div>
        <div>
          <div>
            {values.profile === ProfileOptions.GENERIC && !isLoading && (
              <div className='planning-form-box'>
                <RenderSelect
                  label={'Select Care Location Profile'}
                  options={careLocations}
                  name='careLocation'
                />
              </div>
            )}
          </div>
        </div>
      </div>
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
