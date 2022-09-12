import classnames from 'classnames';
import { Error, Label, Description } from '@components';
import { Field as FormikField, useField, FieldConfig } from 'formik';

export interface TextfieldProps extends FieldConfig {
  name: string;
  label: string | React.ReactNode;
  description?: string | React.ReactNode;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
}

export const Textfield: React.FC<TextfieldProps> = props => {
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

  
  // const [field, meta] = useField(name);

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
            `w-full rounded-none bg-gray-100 block h-10
            border-b-2 border-bcBlack pl-1 disabled:bg-bcDisabled`
            
        }
        disabled={disabled}
        as={as}
        type={type}
        maxLength={maxLength}
        component={component}
       
      />
        

      {/* <Error name={name} /> */}
    </div>
  );
};