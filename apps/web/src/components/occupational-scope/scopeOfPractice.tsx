import { OccupationItemProps } from 'src/common/interfaces';
import { useActivitiesAllowedByOccupation } from 'src/services/useActivitiesAllowedByOccupation';
import { useBundlesWithActivities } from 'src/services/useBundlesWithActivities';
import { Heading } from '../Heading';
import { BasicSelect } from '../Select';
import { ScopeOfPracticeFilters } from './ScopeOfPracticeFilters';
import { OccupationalScopeOfPracticeList } from './ScopeOfPracticeList';
import { ScopeOfPracticeSearch } from './ScopeOfPracticeSearch';

interface OccupationalScopeDetailsScopeOfPracticeProps {
  occupation?: OccupationItemProps;
}
export const OccupationalScopeDetailsScopeOfPractice: React.FC<
  OccupationalScopeDetailsScopeOfPracticeProps
> = ({ occupation }) => {
  const {
    allowedActivities,
    pageIndex,
    pageSize,
    total,
    onPageOptionsChange,
    sortKey,
    sortOrder,
    onSortChange,
    onSearchTextChange,
    filterByPermission,
    onFilterByPermissionChange,
    selectedBundleId,
    onBundleChange,
    isLoading,
  } = useActivitiesAllowedByOccupation(occupation?.id);

  const { bundles } = useBundlesWithActivities();

  // Build bundle filter options for Care Competencies dropdown
  const bundleFilterOptions = [
    { label: 'All', value: '' },
    ...bundles.map(bundle => ({
      label: bundle.displayName,
      value: bundle.id,
    })),
  ];

  if (!occupation) return <></>;

  return (
    <>
      <Heading subTitle='Understand what activities that can/can not be perform by this occupations by search a topics.' />

      <div className='pt-3 flex gap-1 md:gap-3 justify-between items-center flex-row'>
        <ScopeOfPracticeFilters
          filterByPermission={filterByPermission}
          onFilterByPermissionChange={onFilterByPermissionChange}
        />
      </div>

      <div className='pt-3 flex gap-3 items-end'>
        <div className='min-w-[14rem]'>
          <BasicSelect<string>
            id='scope-bundle-filter'
            label='Care Competencies'
            value={selectedBundleId}
            onChange={onBundleChange}
            options={bundleFilterOptions}
            buttonClassName='w-full border border-gray-300 rounded py-3'
          />
        </div>
        <div className='flex-1 max-w-md'>
          <ScopeOfPracticeSearch onSearchTextChange={onSearchTextChange} />
        </div>
      </div>

      <div className='pt-3'>
        <OccupationalScopeOfPracticeList
          allowedActivities={allowedActivities}
          pageIndex={pageIndex}
          pageSize={pageSize}
          total={total}
          onPageOptionsChange={onPageOptionsChange}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
          isLoading={isLoading}
        />
      </div>
    </>
  );
};
