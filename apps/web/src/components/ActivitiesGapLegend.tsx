import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { TooltipIconProps } from 'src/common/interfaces';
import { tooltipIcons } from '../common';
import { Button } from './Button';
import { Popover } from './generic/Popover';

export const ActivitiesGapLegend: React.FC = () => {
  const title = (
    <span className='mx-2 text-sm font-bold text-bcBluePrimary group inline-flex items-center rounded-md focus:ring-blue-500'>
      Click here to view table legend
    </span>
  );
  return (
    <Popover title={title}>
      {(close: () => void) => (
        <>
          <div className={`legend-box`}>
            <h2>Table Legend</h2>
            <ul className='flex flex-col items-start my-4'>
              {Object.values(tooltipIcons).map((value: TooltipIconProps, index) => {
                return (
                  <li
                    key={`legendRow-${index}`}
                    className='flex justify-center items-center my-2 gap-4'
                  >
                    {value.icon && (
                      <FontAwesomeIcon
                        icon={value.icon}
                        className={`min-w-[2rem] h-6 w-6 ${value.style}`}
                      />
                    )}
                    <div>{value.text}</div>
                  </li>
                );
              })}
            </ul>

            <Button variant='outline' type='button' classes={`ml-2`} onClick={close}>
              <FontAwesomeIcon title='Close' icon={faTimes} className='h-4 mr-2' />
              Dismiss
            </Button>
          </div>
        </>
      )}
    </Popover>
  );
};
