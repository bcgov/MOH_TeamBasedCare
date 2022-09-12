import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export interface ButtonProps {
  onClick?: () => void;
  variant: keyof typeof buttonColor;
  loading?: boolean;
  type?: 'submit' | 'reset' | 'button';
  disabled?: boolean;
  classes?: string;
}

export const buttonColor: Record<string, string> = {
  primary: `border-transparent bg-bcBluePrimary text-white hover:bg-blue-800 focus:ring-blue-500`,
  secondary: `border-2 border-bcBluePrimary bg-white text-bcBluePrimary hover:bg-gray-100 focus:ring-blue-500`,
  outline: `border border-gray-400 bg-white hover:bg-gray-100 focus:ring-blue-500`,
};

export const buttonBase = `w-auto inline-flex justify-center items-center rounded 
  shadow-sm px-4 py-2 text-base font-bold focus:outline-none
  disabled:opacity-50
  focus:ring-2 focus:ring-offset-2 sm:mt-0 sm:text-sm`;

export const Button: React.FC<ButtonProps> = props => {
  const { variant, type, children, disabled, classes, loading, onClick } = props;
  return (
    <button
      onClick={onClick}
      type={type}
      className={`
        ${buttonColor[variant]}
        ${variant !== 'link' ? buttonBase : ''}
        ${classes}
      `}
      disabled={disabled}
    >
      {loading ? (
        <FontAwesomeIcon icon={faSpinner} className='h-5 w-5 animate-spin anim' />
      ) : (
        children
      )}
    </button>
  );
};