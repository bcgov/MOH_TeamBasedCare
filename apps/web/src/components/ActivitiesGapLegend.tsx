import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { TooltipIconProps } from 'src/common/interfaces';
import { tooltipIcons } from '../common';
import { Popover } from './generic/Popover';

export const ActivitiesGapLegend: React.FC = () => {
  return (
    <Popover title='Click here to view table legend'>
      <div className={`legend-box`}>
        <h2>Table Legend</h2>
        <ul className='flex flex-col items-start my-4'>
          {Object.values(tooltipIcons).map((value: TooltipIconProps, index) => {
            return (
              <li key={`legendRow-${index}`} className='flex justify-center items-center my-2'>
                { value.icon && <FontAwesomeIcon icon={value.icon} className={`h-6 w-6 ${value.style}`} /> }
                <div className='ml-3'>{value.text}</div>
              </li>
            );
          })}
        </ul>
      </div>
    </Popover>
  );
};
