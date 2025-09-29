import {
  faCheckCircle,
  faExclamationCircle,
  faInfoCircle,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PropsWithChildren } from 'react';

interface AlertProps {
  type: 'warning' | 'info' | 'error' | 'success';
  className?: string;
}

export const Alert: React.FC<PropsWithChildren<AlertProps>> = ({
  type,
  className = '',
  children,
}) => {
  return (
    <div
      role='alert'
      className={`p-4 w-full flex items-center rounded ${className} 
      ${type === 'error' && 'bg-red-100 text-bcRedError'}
      ${type === 'info' && 'bg-blue-100 text-blue-700'}
      ${type === 'success' && 'bg-bcBannerSuccessBg text-bcBannerSuccessText'}
      ${type === 'warning' && 'bg-bcYellowCream text-bcDarkYellow'} `}
    >
      <div className={`flex flex-row gap-4 overflow-y-auto max-h-[16rem]`}>
        {type === 'error' && (
          <FontAwesomeIcon className='h-6 min-w-[1.5rem]' icon={faTimesCircle} />
        )}
        {type === 'info' && <FontAwesomeIcon className='h-6 min-w-[1.5rem]' icon={faInfoCircle} />}
        {type === 'success' && (
          <FontAwesomeIcon className='h-6 min-w-[1.5rem]' icon={faCheckCircle} />
        )}
        {type === 'warning' && (
          <FontAwesomeIcon className='h-6 min-w-[1.5rem]' icon={faExclamationCircle} />
        )}
        {children}
      </div>
    </div>
  );
};
