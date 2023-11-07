import { faCheck, faExclamation, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Heading } from '../Heading';

export interface CardProps {
  color?: CardColor;
  title?: string;
  subtitle?: string;
  extraSpacing?: boolean;
  bgWhite?: boolean;
  className?: string;
}

export enum CardColor {
  GREEN = 'green',
  YELLOW = 'yellow',
  RED = 'red',
}

export const Card: React.FC<CardProps> = ({
  color,
  title,
  subtitle,
  children,
  extraSpacing,
  bgWhite,
  className = '',
}) => {
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
    <div className={`p-3 shadow-md ${className} ${bgWhite ? 'bg-white' : ''}`}>
      <div className={`flex items-center space-x-5 ${extraSpacing ? 'px-8 my-4' : ''}`}>
        {color && (
          <div
            className={`flex-shrink-0 rounded-lg p-4 ${
              color === CardColor.GREEN // inline conditional logic for JIT compiler to purge css classes properly; ref: Dynamic values section at https://v2.tailwindcss.com/docs/just-in-time-mode
                ? 'bg-green-100'
                : color === CardColor.YELLOW
                ? 'bg-yellow-100'
                : 'bg-red-100'
            }`}
          >
            <FontAwesomeIcon
              className={`w-6 h-6 ${
                color === CardColor.GREEN // inline conditional logic for JIT compiler to purge css classes properly; ref: Dynamic values section at https://v2.tailwindcss.com/docs/just-in-time-mode
                  ? 'text-green-600'
                  : color === CardColor.YELLOW
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
              icon={icon}
            />
          </div>
        )}
        <div className='flex-1 min-w-0'>
          <Heading title={title} subTitle={subtitle} />
          {children}
        </div>
      </div>
    </div>
  );
};
