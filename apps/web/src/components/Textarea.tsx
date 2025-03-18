import { useFormikContext } from 'formik';

import { Field, FieldProps } from '@components';
import classNames from 'classnames';

interface TextareaProps extends FieldProps {
  maxLength?: number;
  rows?: number;
  placeholder?: string;
  className?: string;
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
        className={classNames(
          'bg-white h-[150px] w-full border rounded border-bcGray p-1.5 ',
          props.className,
        )}
      />
      {maxLength ? (
        <>
          <p aria-hidden className='text-right relative bottom-10 right-4 h-0'>
            {values[name]?.length ?? 0}/{maxLength}{' '}
            <span className='sr-only'>characters remaining</span>
          </p>
          <p className='sr-only' role='alert'>
            {showMaxLength()}
          </p>
        </>
      ) : null}
    </div>
  );
};
