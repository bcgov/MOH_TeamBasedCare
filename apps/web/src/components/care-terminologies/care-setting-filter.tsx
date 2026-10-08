import { useMemo } from 'react';
import { useCareSettingTemplatesForCMS } from 'src/services/useCareSettingTemplatesForCMS';
import { Button } from '../Button';
import { FilterDropdown } from '../FilterDropdown';

interface CareSettingFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export const CareTerminologiesCareSettingFilter: React.FC<CareSettingFilterProps> = ({
  value,
  onChange,
}) => {
  const { careSettingTemplates, data, error, isValidating, mutate } =
    useCareSettingTemplatesForCMS();
  const isLoading = !data && !error;

  const options = useMemo(
    () => [
      { value: '', label: 'All care settings' },
      ...[...careSettingTemplates].sort((a, b) => a.label.localeCompare(b.label)),
    ],
    [careSettingTemplates],
  );

  return (
    <div className='flex flex-wrap items-center gap-3'>
      <FilterDropdown
        id='terminology-care-setting-filter'
        label='Care Setting'
        options={options}
        value={value}
        onChange={onChange}
        disabled={!data}
      />
      {isLoading && (
        <span role='status' className='text-sm'>
          Loading care settings...
        </span>
      )}
      {error && (
        <div role='alert' className='flex items-center gap-3 text-sm text-red-700'>
          Unable to load care settings.
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
