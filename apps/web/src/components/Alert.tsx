import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface AlertProps {
  type: 'warning' | 'info';
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ type, className = '', children }) => {
  return (
    <div
      role='alert'
      className={`p-4 w-max flex items-center rounded ${className} 
      ${type === 'info' && 'bg-bcLightBlueBackground'}
      ${type === 'warning' && 'bg-bcYellowCream'} `}
    >
      <div
        className={`flex flex-row gap-4
        ${type === 'info' && 'text-bcBluePrimary'}
        ${type === 'warning' && 'text-bcDarkYellow'} `}
      >
        <FontAwesomeIcon className='h-6' icon={faExclamationTriangle}></FontAwesomeIcon>
        {children}
      </div>
    </div>
  );
};
