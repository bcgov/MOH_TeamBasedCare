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
  /**
   * Optional helper sentence rendered under the label. Kept inside the
   * <label> so screen readers announce it with the option rather than as
   * detached text.
   */
  description?: string;
}

export interface BooleanRadioProps {
  name: string;
  legend: string;
  horizontal?: boolean;
  options: RadioOptionType[];
}

const optionLabelClasses = (disabled?: boolean) =>
  `flex items-start ${disabled === true ? '' : 'cursor-pointer'} leading-none`;

const optionInputClasses = (disabled?: boolean) =>
  `mr-2 h-5 w-5 min-w-5 checked:bg-bcBluePrimary ${disabled === true ? '' : 'cursor-pointer'}`;

const OptionText = ({ option }: { option: RadioOptionType }) => (
  <span className='flex flex-col gap-1'>
    <span className='leading-none'>{option.label}</span>
    {option.description && (
      <span className='text-sm text-gray-600 leading-snug'>{option.description}</span>
    )}
  </span>
);

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
              className={optionLabelClasses(option.disabled)}
              title={option.hoverText}
            >
              <FormikField
                type='radio'
                name={name}
                value={option.value}
                className={optionInputClasses(option.disabled)}
                disabled={option.disabled}
              />
              <OptionText option={option} />
            </label>
          ))}
      </div>
      <Error name={name} />
    </fieldset>
  );
};

export interface RadioGroupProps {
  name: string;
  legend: string;
  options: RadioOptionType[];
  value?: string;
  onChange: (value: string) => void;
  horizontal?: boolean;
  /** Applied to the fieldset, so option text can be sized by the caller. */
  className?: string;
  legendClassName?: string;
}

/**
 * Controlled radio group for use outside a Formik form, such as the care
 * setting dialogs. Shares its option markup with `Radio` so the two look and
 * are announced identically.
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  legend,
  options,
  value,
  onChange,
  horizontal,
  className = '',
  legendClassName = '',
}) => {
  return (
    <fieldset className={`flex flex-col gap-4 ${className}`}>
      <legend className={`font-bold mb-4 ${legendClassName}`}>{legend}</legend>
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
              key={option.value + index}
              className={optionLabelClasses(option.disabled)}
              title={option.hoverText}
            >
              <input
                type='radio'
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className={optionInputClasses(option.disabled)}
                disabled={option.disabled}
              />
              <OptionText option={option} />
            </label>
          ))}
      </div>
    </fieldset>
  );
};
