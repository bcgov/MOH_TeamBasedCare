import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface SpinnerProps {
  show: boolean;
  fullScreen?: boolean;
  message?: string;
  sm?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({
  show = false,
  fullScreen = false,
  message,
  sm,
}) => {
  return (
    <>
      {show && (
        <>
          {fullScreen && <div className='absolute w-full h-screen backdropSpinner'></div>}

          <div className='spinner flex flex-col items-center'>
            <FontAwesomeIcon
              icon={faSpinner}
              className={`text-bcBluePrimary ${sm ? 'h-6 w-6' : 'h-12 w-12'} animate-spin anim`}
            />
            {message && <p className='pt-1 font-bold text-4xl text-bcBluePrimary'>{message}</p>}
          </div>
        </>
      )}
    </>
  );
};
