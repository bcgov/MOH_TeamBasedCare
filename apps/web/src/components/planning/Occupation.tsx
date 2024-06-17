import { SearchBar } from '../generic/SearchBar';
import { Paginator } from '../generic/Paginator';
import { Spinner } from '../generic/Spinner';
import { OccupationSelector } from '../OccupationSelector';
import { Form, Formik } from 'formik';
import { usePlanningContent, usePlanningContext, usePlanningOccupations } from '@services';
import { usePlanningProfile } from 'src/services/usePlanningProfile';
import { SaveOccupationDTO } from '@tbcm/common';
import { dtoValidator } from '../../utils/dto-validator';
import { Error } from '../Error';
import { PageTitle } from '../PageTitle';
import { useEffect, useState } from 'react';

export interface OccupationProps {
  step: number;
  title: string;
}

const OccupationForm = ({ searchValue = '' }) => {
  usePlanningContent();
  return (
    <Form className='flex-1 flex flex-col overflow-auto'>
      <OccupationSelector searchValue={searchValue} showDescriptionModal></OccupationSelector>
    </Form>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Occupation: React.FC<OccupationProps> = () => {
  const { updateSessionId } = usePlanningContext();
  const { lastDraft, isLoading } = usePlanningProfile();

  const [searchValue, setSearchValue]: [string, (search: string) => void] = useState('');

  // proceed to next step after submission
  const { handleSubmit, initialValues } = usePlanningOccupations({ proceedToNextOnSubmit: true });

  useEffect(() => {
    if (!lastDraft?.id) return;
    updateSessionId(lastDraft.id);
  }, [lastDraft?.id]);

  // Get search value
  const handleSearch = (e: { target: { value: string } }) => {
    setSearchValue(e.target.value);
  };

  return (
    <div className='planning-form-box'>
      <div className='flex-1 flex flex-col min-h-0'>
        <div className='flex-1 min-h-0 flex flex-col'>
          <div className='flex gap-1 justify-between items-center flex-row'>
            <PageTitle description={'Select all the occupations/roles on your team'} />
            <SearchBar
              className='min-w-[200px] w-1/3'
              placeholderText='Search by keyword'
              handleChange={handleSearch}
            ></SearchBar>
          </div>

          {isLoading ? (
            <Spinner show={isLoading} />
          ) : (
            <Formik
              initialValues={initialValues}
              validate={values => dtoValidator(SaveOccupationDTO, values)}
              onSubmit={handleSubmit}
              validateOnBlur={true}
              enableReinitialize={true}
            >
              {() => (
                <div className='flex-1 flex flex-col min-h-0'>
                  <Paginator></Paginator>
                  <Error name='occupation'></Error>
                  <OccupationForm searchValue={searchValue}></OccupationForm>
                  <Paginator></Paginator>
                </div>
              )}
            </Formik>
          )}
        </div>
      </div>
    </div>
  );
};
