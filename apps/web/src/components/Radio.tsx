/* eslint-disable @typescript-eslint/no-explicit-any */
import classnames from 'classnames';
import { Field as FormikField } from 'formik';
import { Error } from './Error';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
// interface RadioProps {
//   legend: string;
//   name: string;
//   options: RadioOptionType[];
//   horizontal?: boolean;
// }

export interface RadioOptionType {
  label: string;
  value: string;
  disabled: boolean;
}

export interface BooleanRadioProps {
  name: string;
  legend: string;
  horizontal?: boolean;
  options: RadioOptionType[];
}

export const Radio: React.FC<BooleanRadioProps> = ({ legend, name, options, horizontal }) => {
  return (
    <fieldset className='flex flex-col gap-4'>
      <legend className='font-bold mb-4'>{legend}</legend>
      <div
        className={classnames(
          'flex',
          { 'flex-col gap-4': !horizontal },
          { 'flex-row gap-8': horizontal },
        )}
      >
        {options.map((option, index) => (
          <label
            key={option.label + index}
            className='flex items-center cursor-pointer leading-none'
          >
            <FormikField
              type='radio'
              name={name}
              value={option.value}
              disabled={option.disabled}
              className='mr-2 h-5 w-5 min-w-5 checked:bg-bcBluePrimary cursor-pointer'
            />
            {option.label}
          </label>
        ))}
      </div>
      <label className='flex rounded-md bg-blue-100 px-4 ml-6 py-2 text-center text-bcBluePrimary w-3/4'>
        <FontAwesomeIcon icon={faInfoCircle} className='h-6 mr-3 mt-0 text-bcBluePrimary' />
        This functionality is currently under development. Please select Start from a generic
        profile
      </label>
      <Error name={name} />
    </fieldset>
  );
};
