import { PlanningStepHeader } from '@components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { SearchBar } from '../generic/SearchBar';
import { Paginator } from '../generic/Paginator';
import { OccupationSelector } from '../OccupationSelector';
import { Form, Formik } from 'formik';
import { usePlanningContext } from '@services';
import { useEffect } from 'react';
import { useFormikContext } from 'formik';

export interface OccupationProps {
  step: number;
  title: string;
}

const OccupationForm = () => {
  const { isSubmitting, submitForm, isValid } = useFormikContext();

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
    <Form>
      <OccupationSelector></OccupationSelector>
    </Form>
  );
};

export const Occupation: React.FC<OccupationProps> = ({ title }) => {
  const { updateProceedToNext } = usePlanningContext();

  return (
    <div className='planning-form-box'>
      <PlanningStepHeader>{title}</PlanningStepHeader>
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

          <div className='space-y-2'>
            <p className='text-sm font-extralight font-sans text-gray-400'>
              {} occupations selected
            </p>
            <Paginator></Paginator>

            <Formik
              initialValues={{
                occupation: [],
              }}
              onSubmit={() => {
                updateProceedToNext();
              }}
              validateOnBlur={true}
              validateOnMount={true}
              enableReinitialize={true}
            >
              <OccupationForm></OccupationForm>
            </Formik>

            <Paginator></Paginator>
          </div>
        </div>
      </div>
    </div>
  );
};
