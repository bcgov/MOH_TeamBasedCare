import { useFormikContext, useField } from 'formik';

import { Label, Description, Error } from '@components';
import classNames from 'classnames';
import { Field as FormikField } from 'formik';

interface TextareaProps {
  name: string;
  label: string;
  description?: string;
  maxLength?: number;
  rows?: number;
  placeholder?: string;
  className?: string;
}

export const Textarea = (props: TextareaProps) => {
  const { name, label, placeholder, description, maxLength } = props;
  const { values } = useFormikContext<Record<string, string>>();
  const [field, meta] = useField(name);

  const showMaxLength = () => {
    return values[name]?.length === maxLength
      ? `Text area character limit reached. You can only use ${maxLength} characters in this field.`
      : '';
  };

  return (
    <div>
      <div className='mb-2'>
        <Label htmlFor={name}>{label}</Label>
        <Description id={`${name}-description`}>{description}</Description>
      </div>

      <div className='relative'>
        <FormikField
          id={name}
          aria-describedby={description ? `${name}-description` : undefined}
          as='textarea'
          maxLength={maxLength}
          placeholder={placeholder}
          className={classNames(
            'bg-white h-[150px] w-full border rounded border-bcGray p-1.5',
            props.className,
            { 'border-red-500': meta.touched && meta.error },
          )}
          {...field}
        />
        {maxLength ? (
          <p aria-hidden className='absolute bottom-2 right-3 text-sm text-gray-500'>
            {values[name]?.length ?? 0}/{maxLength}{' '}
            <span className='sr-only'>characters remaining</span>
          </p>
        ) : null}
      </div>

      <Error name={name} />

      {maxLength ? (
        <p className='sr-only' role='alert'>
          {showMaxLength()}
        </p>
      ) : null}
    </div>
  );
};
