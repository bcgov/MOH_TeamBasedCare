import { PlanningStepHeader } from '@components';
import { planningFormBox } from '../../styles/styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { SearchBar } from '../generic/SearchBar';
import { useState } from 'react';
import { Paginator } from '../generic/Paginator';
import { OccupationSelector } from '../OccupationSelector';

export interface OccupationProps {
  step: number;
  title: string;
}

export const Occupation: React.FC<OccupationProps> = ({ title }) => {
  const [selectedOccupations, setSelectedOccupations] = useState([]);

  return (
    <div className={planningFormBox}>
      <PlanningStepHeader>{title}</PlanningStepHeader>
      <div className='px-5'>
        <div className='space-y-3'>
          <div className='space-x-1.5 flex'>
            <FontAwesomeIcon className='text-bcDarkBlue inline w-6 h-6' icon={faUserCircle} />
            <h4 className='inline text-bcBluePrimary font-bold font-sans'>
              Select Occupation (Optional)
            </h4>
          </div>

          <div className='space-y-2'>
            <p className='text-sm font-extralight font-sans text-gray-400'>
              Select all the roles on your team.
            </p>
            <SearchBar placeholderText='Search by keyword'></SearchBar>
          </div>

          <div className='space-y-2'>
            <p className='text-sm font-extralight font-sans text-gray-400'>
              {selectedOccupations.length} occupations selected
            </p>
            <Paginator></Paginator>

            <OccupationSelector
              selectedOccupations={selectedOccupations}
              setSelectedOccupations={setSelectedOccupations}
            ></OccupationSelector>

            <Paginator></Paginator>
          </div>
        </div>
      </div>
    </div>
  );
};
