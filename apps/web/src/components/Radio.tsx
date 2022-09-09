import classnames from 'classnames';
// import { Field as FormikField, useField, useFormikContext } from 'formik';

interface RadioProps {
    legend: string;
    name: string;
    options: RadioOptionType[];
    horizontal?: boolean;
  }

export interface RadioOptionType {
    label: string;
    value: string;
}

export interface BooleanRadioProps {
    name: string;
    legend: string;
    horizontal?: boolean;
    options: RadioOptionType[];
  }
  

export const Radio: React.FC<BooleanRadioProps> = ({ legend, name, options, horizontal }) => {    return (
    <fieldset className='flex flex-col gap-4'>
        <legend className='text-bcBluePrimary font-bold mb-4'>{legend}</legend>
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
              className='flex text-bcBluePrimary  items-center cursor-pointer leading-none'
            >
              <input
                type='radio'
                name={name}
                value={option.value}
                className='mr-2 h-5 w-5 min-w-5 checked:bg-bcBluePrimary cursor-pointer'
              />
              {option.label}
            </label>
          ))}
        </div>
        
      </fieldset>
  );
};