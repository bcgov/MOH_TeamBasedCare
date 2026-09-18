import { useCareLocations } from 'src/services/useCareLocations';
import { Button } from '../Button';
import { FilterDropdown } from '../FilterDropdown';

interface UnitFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export const UnitFilter: React.FC<UnitFilterProps> = ({ value, onChange }) => {
  const { careLocations, data, error, isValidating, mutate } = useCareLocations();
  const isLoading = !data && !error;
  const options = [...careLocations].sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className='flex flex-wrap items-center gap-3'>
      <FilterDropdown
        id='template-unit-filter'
        label='Unit'
        options={[{ value: '', label: 'All units' }, ...options]}
        value={value}
        onChange={onChange}
        disabled={!data}
      />
      {isLoading && (
        <span role='status' className='text-sm'>
          Loading units...
        </span>
      )}
      {error && (
        <div role='alert' className='flex items-center gap-3 text-sm text-red-700'>
          Unable to load units.
          <Button
            type='button'
            variant='link'
            disabled={isValidating}
            onClick={() => void mutate()}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
};
