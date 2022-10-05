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
import { PageTitle } from '../PageTitle';
import { useState } from 'react';
import { useOccupations } from 'src/services/useOccupations';

export interface OccupationProps {
  step: number;
  title: string;
}

const OccupationForm = (occupations: any, filteredOccupations: any) => {
  usePlanningContent();

  return (
    <Form className='flex-1 flex flex-col overflow-auto'>
      <OccupationSelector filteredOccupations={filteredOccupations} occupations={occupations} />
    </Form>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Occupation: React.FC<OccupationProps> = ({ title }) => {
  const occupationValidationSchema = createValidator(SaveOccupationDTO);
  const [searchValue, setSearchValue]: [string, (search: string) => void] = useState('');
  const { occupations } = useOccupations();

  const { handleSubmit, initialValues } = usePlanningOccupations();

  // Get search value
  const handleSearch = (e: { target: { value: string } }) => {
    setSearchValue(e.target.value);
  };

  // Filter data with search value
  const filteredOccupations =
    occupations &&
    occupations.filter((item: any) => {
      return item.name.toLowerCase().includes(searchValue.toLowerCase());
    });

  return (
    <div className='planning-form-box'>
      <div className='flex-1 flex flex-col min-h-0'>
        <div className='flex-1 min-h-0 flex flex-col'>
          <PageTitle title={'Select Occupation'} description={'Select all the roles on your team'}>
            <FontAwesomeIcon className='text-bcBluePrimary inline w-6 h-6' icon={faUserCircle} />
          </PageTitle>

          <div>
            {/* <SearchBar placeholderText='Search by keyword'></SearchBar> */}
            <SearchBar handleChange={handleSearch} />
          </div>

          <Formik
            initialValues={initialValues}
            validate={occupationValidationSchema}
            onSubmit={handleSubmit}
            validateOnBlur={true}
            enableReinitialize={true}
          >
            {({ values }) => (
              <div className='flex-1 flex flex-col min-h-0 p-2'>
                <p className='text-sm font-extralight font-sans text-gray-400'>
                  {values.occupation?.length} occupations selected
                </p>
                <Paginator></Paginator>
                <Error name='occupation'></Error>
                {occupations && filteredOccupations.length != 0 ? (
                  <OccupationForm
                    occupations={occupations}
                    filteredOccupations={filteredOccupations}
                  />
                ) : (
                  <p className='text-center text-sm mt-4'>No Occupations found.</p>
                )}
                <Paginator></Paginator>
              </div>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};
