import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { TooltipIconProps } from 'src/common/interfaces';

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
}: TooltipIconProps) => {
  return (
    <div className={`inline-block w-[25px]`}>
      <div className='relative flex flex-col items-center group'>
        <button className='w-[25px]'>
          <FontAwesomeIcon className={`${style}`} icon={icon}></FontAwesomeIcon>
        </button>
        <div
          className={`absolute bottom-3 flex flex-col items-center hidden mb-[25px] group-hover:flex`}
        >
          <span className='relative z-10 min-w-[200px] w-auto p-3 text-sm leading-none text-white bg-bcBlueAccent shadow-sm rounded-sm'>
            {text}
          </span>
          <div className='w-3 h-3 -mt-2 rotate-45 bg-bcBlueAccent'></div>
        </div>
      </div>
    </div>
  );
};
