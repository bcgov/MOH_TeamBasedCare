import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface SpinnerProps {
  show: boolean;
  fullScreen?: boolean;
  size?: SpinnerSize;
}

export enum SpinnerSize {
  SM = 5,
  MD = 10,
  LG = 20,
}

export const Spinner: React.FC<SpinnerProps> = ({
  show = false,
  fullScreen = false,
  size = SpinnerSize.SM,
}) => {
  return (
    <>
      {show && (
        <>
          {fullScreen && <div className='absolute w-full h-screen backdropSpinner'></div>}

          <div className='spinner'>
            <FontAwesomeIcon
              icon={faSpinner}
              className={`text-bcBluePrimary h-${size} w-${size} animate-spin anim`}
            />
          </div>
        </>
      )}
    </>
  );
};
