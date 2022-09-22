import { PageTitle, Button } from '@components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { activityGapLegend } from '../../common';

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
          {activityGapLegend.map((i: any, index: any) => {
            return (
              <li key={index} className='flex justify-center items-center my-2'>
                <FontAwesomeIcon icon={i.faIcon} color={i.color} className='h-6 w-6' />
                <div className='ml-3'>{i.text}</div>
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
