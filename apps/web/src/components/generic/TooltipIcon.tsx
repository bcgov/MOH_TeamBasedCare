import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { TooltipIconProps } from 'src/common/interfaces';
import { Popover, PopoverPosition } from './Popover';

const tooltipDefaultValues = {
  text: 'Please provide your icon description.',
  icon: faExclamationCircle,
  meaning: 'No meaning has been provided.',
  style: 'text-bcGrayDisabled',
};

export const TooltipIcon = ({
  text = tooltipDefaultValues.text,
  icon = tooltipDefaultValues.icon,
  style = tooltipDefaultValues.style,
  position,
}: TooltipIconProps) => {
  return (
    <div className={`inline-block w-[25px]`}>
      <div className='relative flex flex-col items-center group'>
        <Popover
          position={position}
          title={<FontAwesomeIcon className={`${style} w-[25px]`} icon={icon}></FontAwesomeIcon>}
        >
          {() => (
            <>
              <div
                className={`absolute w-4 h-4 rotate-60 bg-bcBlueAccent ${
                  position === PopoverPosition.BOTTOM_LEFT && 'right-0'
                }`}
              ></div>
              <div className='w-[200px] w-auto p-3 text-sm text-white bg-bcBlueAccent shadow-xl rounded-lg'>
                {text}
              </div>
            </>
          )}
        </Popover>
      </div>
    </div>
  );
};
