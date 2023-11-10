import { OccupationItemProps } from 'src/common/interfaces';
import { useActivitiesAllowedByOccupation } from 'src/services/useActivitiesAllowedByOccupation';
import { Heading } from '../Heading';
import { ScopeOfPracticeFilters } from './ScopeOfPracticeFilters';
import { OccupationalScopeOfPracticeList } from './ScopeOfPracticeList';
import { ScopeOfPracticeSearch } from './ScopeOfPracticeSearch';

interface OccupationalScopeDetailsScopeOfPracticeProps {
  occupation?: OccupationItemProps;
}
export const OccupationalScopeDetailsScopeOfPractice: React.FC<OccupationalScopeDetailsScopeOfPracticeProps> =
  ({ occupation }) => {
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
      isLoading,
    } = useActivitiesAllowedByOccupation(occupation?.id);
    if (!occupation) return <></>;

    return (
      <>
        <Heading subTitle='Understand what activities that can/can not be perform by this occupations by search a topics.' />

        <div className='pt-3 flex justify-between flex-row'>
          <ScopeOfPracticeFilters
            filterByPermission={filterByPermission}
            onFilterByPermissionChange={onFilterByPermissionChange}
          />
          <ScopeOfPracticeSearch onSearchTextChange={onSearchTextChange} />
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
