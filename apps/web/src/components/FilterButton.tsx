import { Button } from './Button';

export interface FilterButtonProps<T> {
  label: string;
  value: T;
  selectedValue: T;
  onChange: (value?: T) => void;
}

export const FilterButton = <T,>({
  label,
  value,
  onChange,
  selectedValue,
}: FilterButtonProps<T>) => {
  return (
    <div className='flex align-middle'>
      <Button
        variant={value === selectedValue ? 'primary' : 'secondary'}
        onClick={() => onChange(value)}
      >
        {label}
      </Button>
    </div>
  );
};
