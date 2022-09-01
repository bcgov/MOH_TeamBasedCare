import classnames from 'classnames';
import { Error, Label, Description } from '@components';
import { Field as FormikField, useField, FieldConfig } from 'formik';

export interface FieldProps extends FieldConfig {
  name: string;
  label: string | React.ReactNode;
  description?: string | React.ReactNode;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
}

export const Field: React.FC<FieldProps> = props => {
  const {
    name,
    label,
    disabled,
    description,
    type,
    as,
    component,
    className,
    maxLength,
    children,
  } = props;

  console
  const [field, meta] = useField(name);

  return (
    <div>
      <div className='mb-2'>
        <Label htmlFor={name}>{label}</Label>

        <Description id={`${name}-description`}>{description}</Description>
      </div>

      <FormikField
        id={name}
        aria-describedby={description ? `${name}-description` : null}
        className={
          className ??
          classnames(
            `w-full rounded-none bg-gray-100 block h-10
            border-b-2 border-bcBlack pl-1 disabled:bg-bcDisabled`,
            {
              'border-red-500': meta.touched && meta.error,
            },
          )
        }
        disabled={disabled}
        as={as}
        type={type}
        maxLength={maxLength}
        component={component}
        {...field}
      >
        {children}
      </FormikField>

      <Error name={name} />
    </div>
  );
};