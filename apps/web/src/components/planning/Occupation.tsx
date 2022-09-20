import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { SearchBar } from '../generic/SearchBar';
import { Paginator } from '../generic/Paginator';
import { OccupationSelector } from '../OccupationSelector';
import { Form, Formik } from 'formik';
import { usePlanningContent, usePlanningOccupations } from '@services';
import { SaveOccupationDTO } from '@tbcm/common';
import createValidator from 'class-validator-formik';
import { Error } from '../Error';

export interface OccupationProps {
  step: number;
  title: string;
}

const OccupationForm = () => {
  usePlanningContent();
  return (
    <Form>
      <OccupationSelector></OccupationSelector>
    </Form>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Occupation: React.FC<OccupationProps> = ({ title }) => {
  const occupationValidationSchema = createValidator(SaveOccupationDTO);

  const { handleSubmit, initialValues } = usePlanningOccupations();

  return (
    <div className='planning-form-box'>
      <div className='px-5'>
        <div className='space-y-3'>
          <div className='space-x-1.5 flex'>
            <FontAwesomeIcon className='text-bcDarkBlue inline w-6 h-6' icon={faUserCircle} />
            <h4 className='inline text-bcBluePrimary font-bold font-sans'>Select Occupation</h4>
          </div>

          <div className='space-y-2'>
            <p className='text-sm font-extralight font-sans text-gray-400'>
              Select all the roles on your team.
            </p>
            <SearchBar placeholderText='Search by keyword'></SearchBar>
          </div>

          <Formik
            initialValues={initialValues}
            validate={occupationValidationSchema}
            onSubmit={handleSubmit}
            validateOnBlur={true}
            enableReinitialize={true}
          >
            {({ values }) => (
              <div className='space-y-2'>
                <p className='text-sm font-extralight font-sans text-gray-400'>
                  {values.occupation?.length} occupations selected
                </p>
                <Paginator></Paginator>
                <Error name='occupation'></Error>
                <OccupationForm></OccupationForm>
                <Paginator></Paginator>
              </div>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};
