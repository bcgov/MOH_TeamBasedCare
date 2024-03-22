import { Dispatch, SetStateAction } from 'react';
import { Formik, Form as FormikForm, useFormikContext } from 'formik';
import { dtoValidator } from '../../utils/dto-validator';
import { CreateUserInviteDTO, RoleOptions } from '@tbcm/common';
import { useUserInvite } from 'src/services/useUserInvite';
import { Field } from '../Field';
import { Button } from '../Button';
import { MultiSelect } from '../Select';
import { RoleTagVariant } from 'src/common';

interface InviteUserFormProps {
  setShowModal: Dispatch<SetStateAction<boolean>>;
  isLoading: boolean;
}

export const InviteUserForm: React.FC<InviteUserFormProps> = ({ setShowModal, isLoading }) => {
  const { values, setFieldValue } = useFormikContext<CreateUserInviteDTO>();

  return (
    <FormikForm>
      <p>Please enter the information about the user you are inviting to use the system</p>

      <div className='pt-4'>
        <Field
          type='text'
          label={
            <span>
              Email<sup className='text-bcRedError'>*</sup>
            </span>
          }
          name='email'
          autoComplete='off'
        />
      </div>

      <div className='pt-2'>
        <MultiSelect<string>
          id='invite-roles'
          label='Roles'
          value={RoleOptions.filter(option => (values.roles || []).includes(option.value)).map(
            r => r.value,
          )}
          options={RoleOptions.map(option => ({
            ...option,
            tagVariant: RoleTagVariant[option.value],
          }))}
          onChange={value => setFieldValue('roles', value)}
        />

        <div className='mt-5 flex flex-row-reverse gap-3'>
          <Button variant='primary' type='submit' loading={isLoading} disabled={isLoading}>
            Submit
          </Button>
          <Button variant='secondary' type='button' onClick={() => setShowModal(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </FormikForm>
  );
};

interface InviteUserProps {
  setShowModal: Dispatch<SetStateAction<boolean>>;
  successCb: () => void;
}

export const InviteUser: React.FC<InviteUserProps> = ({ setShowModal, successCb }) => {
  const { handleSubmit, initialValues, isLoading } = useUserInvite();

  return (
    <Formik
      initialValues={initialValues}
      validate={values => dtoValidator(CreateUserInviteDTO, values)}
      onSubmit={values => handleSubmit(values, successCb)}
      validateOnBlur={false}
      validateOnMount={false}
      enableReinitialize={true}
    >
      <InviteUserForm setShowModal={setShowModal} isLoading={isLoading} />
    </Formik>
  );
};
