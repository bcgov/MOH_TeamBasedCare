import { FastField } from 'formik';
import { Error } from '../Error';

export interface OptionType {
  label: string;
  value: string;
  disabled?: boolean;
  hidden?: boolean;
}

interface DropdownProps {
  label: string;
  options: OptionType[];
  name: string;
  disabled?: boolean;
}

export const RenderSelect: React.FC<DropdownProps> = ({ name, label, disabled, options }) => {
  return (
    <div>
      <legend className='font-bold mb-4'>{label}</legend>
      <FastField
        name={name}
        label={label}
        disabled={disabled}
        as='select'
        role='listbox'
        className='bg-gray-100 border-b-2 border-gray-900 text-gray-900 text-sm rounded-sm focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5'
      >
        <option value={''} key={''} className='hidden' role='option'></option>
        {options.map((option: OptionType) => {
          return (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              hidden={option.disabled}
              role='option'
            >
              {option.label}
            </option>
          );
        })}
      </FastField>
      <Error name={name} />
    </div>
  );
};
