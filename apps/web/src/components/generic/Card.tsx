import { faCheck, faExclamation, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export interface CardProps {
  color: CardColor;
  title: string;
  subtitle: string;
}

export enum CardColor {
  GREEN = 'green',
  YELLOW = 'yellow',
  RED = 'red',
}

export const Card: React.FC<CardProps> = ({ color, title, subtitle }) => {
  const iconBgClass = `bg-${color}-100`;
  const iconTextClass = `text-${color}-600`;

  let icon = faExclamation;
  switch (color) {
    case CardColor.GREEN:
      icon = faCheck;
      break;
    case CardColor.YELLOW:
      icon = faExclamation;
      break;
    case CardColor.RED:
      icon = faTimes;
      break;
  }

  return (
    <div className='p-3 shadow-md'>
      <div className='flex items-center space-x-5 my-4'>
        <div className={`flex-shrink-0 rounded-lg p-4 ${iconBgClass}`}>
          <FontAwesomeIcon className={`w-6 h-6 ${iconTextClass}`} icon={icon} />
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-2xl font-extrabold text-gray-900 truncate dark:text-white'>{title}</p>
          <p className='text-sm text-gray-500 truncate dark:text-gray-400'>{subtitle}</p>
        </div>
      </div>
    </div>
  );
};
