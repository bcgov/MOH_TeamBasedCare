import { Field } from "formik";

interface CheckboxProps {
  name: string;
  label: string;
  value?: string;
}

export interface CheckboxOptionType {
  label: string;
  value: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ name, label, value }) => {
  /**
   * if being used in an array, unique values will be passed which should be used
   * instead of name, which will be the same for each item in the list
   */
  const identifier = value ?? name;
  return (
    <div className='flex items-center text-bcBluePrimary'>

      
      <Field
        name={name}
        id={identifier}
        value={value}
        type='checkbox'
        className='mr-3 h-5 w-5 min-w-5'
      />
      <label htmlFor={identifier} className='cursor-pointer'>
        {label}
      </label>
    </div>
  );
};

interface CheckboxArrayProps {
  name: string;
  legend: string;
  options: CheckboxOptionType[];
}

export const CheckboxArray: React.FC<CheckboxArrayProps> = ({ name, legend, options }) => {
  return (
    <fieldset className='flex flex-col gap-4'>
      <legend className='text-bcBlack font-bold mb-2'>{legend}</legend>
      {options.map(option => (
        <Checkbox key={option.value} name={name} value={option.value} label={option.label} />
      ))}
    </fieldset>
  );
};
