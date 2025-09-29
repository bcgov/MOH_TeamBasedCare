import React from 'react';
import classnames from 'classnames';
import { Error, Label, Description } from '@components';
import { Field as FormikField, useField, FieldAttributes } from 'formik';

export interface FieldProps extends FieldAttributes<any> {
  name: string;
  label: string | React.ReactNode;
  description?: string | React.ReactNode;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
  bgColour?: string;
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
    bgColour,
    ...others
  } = props;
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
            `w-full rounded-none block h-10
            border-b-2 border-bcBlack pl-1 disabled:bg-bcDisabled ${
              bgColour ? bgColour : 'bg-bcGrayInput'
            }`,
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
        {...others}
      >
        {children}
      </FormikField>

      <Error name={name} />
    </div>
  );
};
