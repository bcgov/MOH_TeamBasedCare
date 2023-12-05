/* eslint-disable @typescript-eslint/no-explicit-any */
import classnames from 'classnames';
import { Field as FormikField } from 'formik';
import { Error } from './Error';

// interface RadioProps {
//   legend: string;
//   name: string;
//   options: RadioOptionType[];
//   horizontal?: boolean;
// }

export interface RadioOptionType {
  label: string;
  value: string;
  disabled?: boolean;
  hidden?: boolean;
  hoverText?: string;
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
        {options
          .filter(option => !option.hidden)
          .map((option, index) => (
            <label
              key={option.label + index}
              className={`flex items-center ${
                option.disabled === true ? '' : 'cursor-pointer'
              } leading-none`}
              title={option.hoverText}
            >
              <FormikField
                type='radio'
                name={name}
                value={option.value}
                className={`mr-2 h-5 w-5 min-w-5 checked:bg-bcBluePrimary ${
                  option.disabled === true ? '' : 'cursor-pointer'
                }`}
                disabled={option.disabled}
              />
              {option.label}
            </label>
          ))}
      </div>
      <Error name={name} />
    </fieldset>
  );
};
