import { Dispatch, SetStateAction } from 'react';
import { Formik, Form as FormikForm, useFormikContext } from 'formik';
import createValidator from 'class-validator-formik';
import { EditUserDTO, RoleOptions, UserRO } from '@tbcm/common';
import { ReactSelectInput, getSelectStyleOverride } from '../BasicSelect';
import { Field } from '../Field';
import { Label } from '../Label';
import ReactSelect from 'react-select';
import { SelectOption } from 'src/common/select-options.constants';
import { Button } from '../Button';
import { useUserEdit } from 'src/services/useUserEdit';

interface EditUserFormProps {
  user: UserRO;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  isLoading: boolean;
}

export const EditUserForm: React.FC<EditUserFormProps> = ({ user, setShowModal, isLoading }) => {
  const { values, setFieldValue } = useFormikContext<EditUserDTO>();

  return (
    <FormikForm>
      <p>
        Please be aware that changing this role may result in alterations to feature accessibility.
      </p>

      <div className='pt-4'>
        <Field type='text' label='Email' name='email' disabled value={user.email} />
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

interface EditUserProps {
  user: UserRO;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  successCb: () => void;
}

export const EditUser: React.FC<EditUserProps> = ({ user, setShowModal, successCb }) => {
  const validationSchema = createValidator(EditUserDTO);
  const { handleSubmit, initialValues, isLoading } = useUserEdit(user);

  return (
    <Formik
      initialValues={initialValues}
      validate={validationSchema}
      onSubmit={values => handleSubmit(values, successCb)}
      validateOnBlur={false}
      validateOnMount={false}
      enableReinitialize={true}
    >
      <EditUserForm user={user} setShowModal={setShowModal} isLoading={isLoading} />
    </Formik>
  );
};
