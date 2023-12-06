import { useFormikContext } from 'formik';

import { Field, FieldProps } from '@components';

interface TextareaProps extends FieldProps {
  maxLength?: number;
  rows?: number;
  placeholder?: string;
}

export const Textarea = (props: TextareaProps) => {
  const { name, label, placeholder, description, maxLength } = props;
  const { values } = useFormikContext<Record<string, string>>();

  const showMaxLength = () => {
    return values[name]?.length === maxLength
      ? `Text area character limit reached. You can only use ${maxLength} characters in this field.`
      : '';
  };

  return (
    <div>
      <Field
        name={name}
        label={label}
        description={description}
        placeholder={placeholder}
        maxLength={maxLength}
        as='textarea'
        className='bg-white h-[150px] w-full border rounded border-bcGray p-1.5 '
      />
      {maxLength ? (
        <>
          <p aria-hidden className='text-right relative -top-12 -left-4 h-0'>
            {values[name]?.length}/{maxLength} <span className='sr-only'>characters remaining</span>
          </p>
          <p className='sr-only' role='alert'>
            {showMaxLength()}
          </p>
        </>
      ) : null}
    </div>
  );
};
