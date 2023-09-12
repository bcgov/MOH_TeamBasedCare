/* eslint-disable @typescript-eslint/no-explicit-any */
import { Radio } from '@components';
import { Form, Formik, useFormikContext } from 'formik';
import { useCareLocations, usePlanningContent } from '../../services';
import { SaveProfileDTO } from '@tbcm/common';
import createValidator from 'class-validator-formik';
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
  profileOption: string;
  careLocation: string;
}

export const profileOptions = [
  {
    label: 'Start from a generic profile',
    value: ProfileOptions.GENERIC,
    selected: false,
    disabled: true,
  },
  {
    label: 'Start a new profile from scratch',
    value: ProfileOptions.FROM_SCRATCH,
    selected: false,
  },
];

const ProfileForm = () => {
  const { values } = useFormikContext<ProfileFormProps>();
  const { careLocations, isLoading } = useCareLocations();

  usePlanningContent();

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
            <span className='font-bold'>Start from a generic profile</span> is currently under
            development. Please select{' '}
            <span className='font-bold'>Start a new profile from scratch</span>
          </div>
        </div>

        <div>
          <div>
            {values.profileOption === ProfileOptions.FROM_SCRATCH && !isLoading && (
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
