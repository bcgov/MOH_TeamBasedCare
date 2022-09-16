import { ErrorMessage } from 'formik';

export interface ErrorProps {
  name: string;
}

export const Error: React.FC<ErrorProps> = ({ name }) => {
  return (
    <div role='alert'>
      <ErrorMessage name={name}>
        {msg => <p className='block text-red-600 text-sm'>{msg}</p>}
      </ErrorMessage>
    </div>
  );
};
