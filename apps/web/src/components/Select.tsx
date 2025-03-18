import { OptionValueType } from 'src/common/select-options.constants';
import { Label } from './Label';
import { HeadlessList, HeadlessListOptions } from './HeadlessList';

export interface SelectProps<T extends OptionValueType> {
  id: string;
  options: HeadlessListOptions<T>[];
  value: T | T[];
  label?: string;
  menuPlacement?: 'bottom' | 'top' | 'right' | 'left';
  className?: string;
}

export interface BasicSelectProps<T extends OptionValueType> extends SelectProps<T> {
  buttonClassName?: string;
  value: T;
  onChange: (value: T) => void;
}

export interface MultiSelectProps<T extends OptionValueType> extends SelectProps<T> {
  buttonClassName?: string;
  value: T[];
  onChange: (value: T[]) => void;
}

export const BasicSelect = <T extends OptionValueType>(props: BasicSelectProps<T>) => {
  const { id, value, label, options, onChange, menuPlacement, buttonClassName, className } = props;

  return (
    <>
      <SelectLabel id={id} label={label} />
      <HeadlessList
        id={id}
        options={options}
        value={value}
        onChange={value => onChange(value as T)}
        menuPlacement={menuPlacement}
        buttonClassName={buttonClassName}
        className={className}
      />
    </>
  );
};

export const MultiSelect = <T extends OptionValueType>(props: MultiSelectProps<T>) => {
  const { id, value, label, options, onChange, menuPlacement, buttonClassName } = props;

  return (
    <div>
      <SelectLabel id={id} label={label} />
      <HeadlessList
        isMulti
        id={id}
        options={options}
        value={value}
        onChange={value => onChange(value as T[])}
        menuPlacement={menuPlacement}
        buttonClassName={buttonClassName}
      />
    </div>
  );
};

const SelectLabel = ({ id, label }: { id: string; label?: string }) => {
  return (
    <>
      {label && (
        <div className='mb-2'>
          <Label htmlFor={id}>{label}</Label>
        </div>
      )}
    </>
  );
};
