import { Permissions } from '@tbcm/common';
import { FilterButtonGroup } from '../FilterButtonGroup';

interface ScopeOfPracticeFiltersProps {
  filterByPermission?: Permissions;
  onFilterByPermissionChange: ({ value }: { value?: Permissions }) => void;
}

export const ScopeOfPracticeFilters: React.FC<ScopeOfPracticeFiltersProps> = ({
  filterByPermission,
  onFilterByPermissionChange,
}) => {
  const options = [
    { label: 'All' },
    { label: 'Within scope of practice', value: Permissions.PERFORM },
    { label: 'With limit and conditions', value: Permissions.LIMITS },
  ];

  return (
    <>
      <FilterButtonGroup<Permissions>
        options={options}
        selectedValue={filterByPermission}
        onFilterChange={onFilterByPermissionChange}
      />
    </>
  );
};
