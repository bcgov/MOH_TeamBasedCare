import { FilterButton } from './FilterButton';

export interface FilterButtonGroupProps<T> {
  options: { label: string; value?: T }[];
  selectedValue?: T;
  onFilterChange?: ({ value }: { value?: T }) => void;
}

export const FilterButtonGroup = <T,>({
  options = [],
  selectedValue,
  onFilterChange,
}: FilterButtonGroupProps<T>) => {
  return (
    <div className='flex align-middle gap-3 flex-row'>
      {options.map((option, i) => (
        <FilterButton
          label={option.label}
          value={option.value}
          onChange={() => onFilterChange?.({ value: option?.value })}
          selectedValue={selectedValue}
          key={i}
        />
      ))}
    </div>
  );
};
