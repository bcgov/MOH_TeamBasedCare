import { Button } from '@components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { tooltipIcons } from '../common';

export const ActivitiesGapLegend: React.FC = () => {
  const [openLegend, setOpenLegend] = useState(false);
  return (
    <>
      {!openLegend && (
        <a href='#' onClick={() => setOpenLegend(true)}>
          Click here to view table legend
        </a>
      )}
      {openLegend && (
        <div className={`legend-box`}>
          <h2>Table Legend</h2>
          <ul className='flex flex-col items-start my-4'>
            {Object.values(tooltipIcons).map((value: any, index) => {
              return (
                <li key={`legendRow-${index}`} className='flex justify-center items-center my-2'>
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
      )}
    </>
  );
};