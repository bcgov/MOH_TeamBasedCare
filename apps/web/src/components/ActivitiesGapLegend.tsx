import { faList, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { TooltipIconProps } from 'src/common/interfaces';
import { tooltipIcons } from '../common';
import { Button, buttonBase, buttonColor } from './Button';
import { Popover, PopoverPosition } from './generic/Popover';

export const ActivitiesGapLegend: React.FC = () => {
  // Using styled span instead of Button to avoid nested <button> elements
  // (PopoverUI.Button already renders as a button)
  const title = (
    <span className={`${buttonBase} ${buttonColor.secondary}`}>
      Table legend
      <FontAwesomeIcon title='Close' icon={faList} className='h-4 ml-2 mr-1' />
    </span>
  );
  return (
    <Popover title={title} position={PopoverPosition.BOTTOM_LEFT}>
      {(close: () => void) => (
        <>
          <div className={`legend-box w-[24rem] lg:w-[44rem]`}>
            {/* width based on Popover max widths and screen equivalents*/}
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
