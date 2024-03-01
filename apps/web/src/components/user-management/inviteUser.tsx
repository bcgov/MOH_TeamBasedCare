import { Dispatch, SetStateAction } from 'react';
import { Formik, Form as FormikForm, useFormikContext } from 'formik';
import createValidator from 'class-validator-formik';
import { CreateUserInviteDTO, RoleOptions } from '@tbcm/common';
import { useUserInvite } from 'src/services/useUserInvite';
import { ReactSelectInput, getSelectStyleOverride } from '../BasicSelect';
import { Field } from '../Field';
import { Label } from '../Label';
import ReactSelect from 'react-select';
import { SelectOption } from 'src/common/select-options.constants';
import { Button } from '../Button';

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
        <div className='pb-2'>
          <Label htmlFor='roles'>Roles</Label>
        </div>

        <ReactSelect<SelectOption<string>, true>
          inputId='role-filter'
          aria-label='select role'
          placeholder='Select'
          value={RoleOptions.filter(option => (values.roles || []).includes(option.value))}
          onChange={value =>
            setFieldValue(
              'roles',
              value.map(v => v.value),
            )
          }
          options={[...RoleOptions]}
          styles={getSelectStyleOverride<SelectOption<string>>()}
          isMulti
          isClearable
          className='w-full min-w-full md:min-w-0 mx-1 placeholder-bcGray'
          components={{ Input: ReactSelectInput }}
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
  const validationSchema = createValidator(CreateUserInviteDTO);
  const { handleSubmit, initialValues, isLoading } = useUserInvite();

  return (
    <Formik
      initialValues={initialValues}
      validate={validationSchema}
      onSubmit={values => handleSubmit(values, successCb)}
      validateOnBlur={false}
      validateOnMount={false}
      enableReinitialize={true}
    >
      <InviteUserForm setShowModal={setShowModal} isLoading={isLoading} />
    </Formik>
  );
};
