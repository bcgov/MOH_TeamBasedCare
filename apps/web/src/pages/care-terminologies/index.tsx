import { NextPage } from 'next';
import AppLayout from 'src/components/AppLayout';
import { CareTerminologiesList, CareTerminologiesSearch } from 'src/components/care-terminologies';
import { useCareActivitiesFind } from 'src/services/useCareActivitiesFind';

const CareTerminologies: NextPage = () => {
  const {
    careActivities,
    pageIndex,
    pageSize,
    total,
    onPageOptionsChange,
    sortKey,
    sortOrder,
    onSortChange,
    onSearchTextChange,
    isLoading,
  } = useCareActivitiesFind();

  return (
    <AppLayout>
      <div className='flex flex-1 flex-col gap-3 mt-5'>
        <CareTerminologiesSearch onSearchTextChange={onSearchTextChange} />
        <div className='flex-1'>
          <CareTerminologiesList
            careActivities={careActivities}
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
      </div>
    </AppLayout>
  );
};

export default CareTerminologies;
