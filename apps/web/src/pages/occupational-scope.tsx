import { NextPage } from 'next';
import AppLayout from 'src/components/AppLayout';
import { OccupationalScopeList } from 'src/components/occupational-scope';
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
    isLoading,
  } = useOccupationsFind();

  return (
    <AppLayout>
      {/* <OccupationalScopeSearch /> */}
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
    </AppLayout>
  );
};

export default OccupationalScope;
