import { NextPage } from 'next';
import AppLayout from 'src/components/AppLayout';
import { OccupationalScopeList } from 'src/components/occupational-scope';
import { OccupationalScopeSearch } from 'src/components/occupational-scope/search';
import { useOccupationsFind } from 'src/services/useOccupationsFind';

const OccupationalScope: NextPage = () => {
  const {
    occupations,
    pageIndex,
    pageSize,
    total,
    onPageOptionsChange,
    sortKey,
    sortOrder,
    onSortChange,
    onSearchTextChange,
    isLoading,
  } = useOccupationsFind();

  return (
    <AppLayout>
      <div className='flex flex-1 flex-col gap-3 mt-5'>
        <OccupationalScopeSearch onSearchTextChange={onSearchTextChange} />
        <div className='flex-1'>
          <OccupationalScopeList
            occupations={occupations}
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

export default OccupationalScope;
