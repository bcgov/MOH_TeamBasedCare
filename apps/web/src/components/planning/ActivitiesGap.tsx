import { PageTitle, Button } from '@components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { tooltipIcons } from '../../common';

export interface ActivitiesGapProps {
  step: number;
  title: string;
}

const Legend: React.FC = () => {
  const [openLegend, setOpenLegend] = useState(false);
  return (
    <>
      {!openLegend && (
        <a href='#' onClick={() => setOpenLegend(true)}>
          Click here to view table legend
        </a>
      )}
      <div className={` ${!openLegend && 'hidden'} planning-form-box`}>
        <h2>Table Legend</h2>
        <ul className='flex flex-col items-start my-4'>
          {Object.values(tooltipIcons).map((value: any, index) => {
            return (
              <li key={index} className='flex justify-center items-center my-2'>
                <FontAwesomeIcon icon={value.icon} className={`h-6 w-6 ${value.style}`} />
                <div className='ml-3'>{value.text}</div>
              </li>
            );
          })}
        </ul>
        <Button variant='outline' onClick={() => setOpenLegend(false)}>
          <FontAwesomeIcon icon={faTimes} className='h-4 mr-2' />
          Dismiss
        </Button>
      </div>
    </>
  );
};

export const ActivitiesGap: React.FC<ActivitiesGapProps> = ({ title }) => {
  const description =
    'Based on the roles and tasks that you filled in the previous steps, here are the the gaps that we found. Expanding the row on the left hand side table to view more.';

  return (
    <div className='planning-form-box'>
      <PageTitle title={title} description={description}>
        <FontAwesomeIcon icon={faChartBar} className='h-6 text-bcBluePrimary' />
      </PageTitle>
      <Legend />
    </div>
  );
};
