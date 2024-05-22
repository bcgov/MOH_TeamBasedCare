import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export interface ButtonProps {
  onClick?: () => void;
  variant: keyof typeof buttonColor;
  loading?: boolean;
  type?: 'submit' | 'reset' | 'button';
  disabled?: boolean;
  classes?: string;
  onBlur?: () => void;
}

export const buttonColor: Record<string, string> = {
  primary: `border-transparent bg-bcBluePrimary text-white hover:bg-blue-800 focus:ring-blue-500`,
  error: `border-transparent bg-bcRedError text-white hover:bg-red-800 focus:ring-red-500`,
  secondary: `border-2 border-bcBluePrimary bg-white text-bcBluePrimary hover:bg-gray-100 focus:ring-blue-500`,
  outline: `border border-gray-400 bg-white hover:bg-gray-100 focus:ring-blue-500`,
  link: `text-bcBlueLink dark:text-blue-500 underline font-bold hover:text-bcBluePrimary`,
};

export const buttonBase = `w-auto inline-flex justify-center items-center rounded 
  shadow-sm px-4 py-2 text-base font-bold focus:outline-none
  disabled:opacity-50 disabled:pointer-events-none
  focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:text-sm`;

export const Button: React.FC<ButtonProps> = props => {
  const { variant, type, children, disabled, classes, loading, onClick, onBlur } = props;
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
      onBlur={onBlur}
    >
      {loading ? (
        <FontAwesomeIcon icon={faSpinner} className='h-5 w-5 animate-spin anim' />
      ) : (
        children
      )}
    </button>
  );
};
