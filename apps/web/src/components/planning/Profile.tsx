/* eslint-disable @typescript-eslint/no-explicit-any */
import { Radio } from '@components';
import { Form, Formik, useFormikContext } from 'formik';
import { useCareLocations, usePlanningContent } from '../../services';
import { SaveProfileDTO } from '@tbcm/common';
import createValidator from 'class-validator-formik';
import { RenderSelect } from '../generic/RenderSelect';
import { usePlanningProfile } from '../../services/usePlanningProfile';
import { usePlanningContext } from '../../services';
import { useEffect } from 'react';
import _ from 'lodash';

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
    disabled: false,
  },
  {
    label: 'Start a new profile from scratch',
    value: ProfileOptions.FROM_SCRATCH,
    disabled: true,
  },
];

const ProfileForm = () => {
  const { values } = useFormikContext<ProfileFormProps>();
  const { careLocations, isLoading } = useCareLocations();
  const { updateDisableNextButton } = usePlanningContext();

  usePlanningContent();
  useEffect(() => {
    if (!_.isEmpty(values.profile) && !_.isEmpty(values.careLocation)) {
      updateDisableNextButton();
    }
  }, [values]);

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
