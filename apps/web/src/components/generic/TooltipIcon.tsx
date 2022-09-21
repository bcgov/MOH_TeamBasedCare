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
    <div className='inline-block w-5'>
      <div className='relative flex flex-col items-center group'>
        <button className='w-5'>
          <FontAwesomeIcon className={`${style}`} icon={icon}></FontAwesomeIcon>
        </button>
        <div className='absolute bottom-3 flex flex-col items-center hidden mb-6 group-hover:flex'>
          <span className='relative z-10 p-3 text-sm leading-none text-white whitespace-no-wrap bg-bcBlueAccent shadow-sm rounded-sm'>
            {text}
          </span>
          <div className='w-3 h-3 -mt-2 rotate-45 bg-bcBlueAccent'></div>
        </div>
      </div>
    </div>
  );
};
