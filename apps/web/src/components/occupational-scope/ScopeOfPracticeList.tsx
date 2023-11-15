import { OccupationalScopeOfPracticeSortKeys, SortOrder } from '@tbcm/common';
import { AllowedActivityByOccupation } from 'src/common/interfaces';
import { isOdd } from 'src/common/util';
import { AppErrorMessage } from '../AppErrorMessage';
import { Spinner } from '../generic/Spinner';
import { PageOptions, Pagination } from '../Pagination';
import { SortButton } from '../SortButton';

interface TableHeaderProps {
  sortKey?: OccupationalScopeOfPracticeSortKeys;
  sortOrder?: SortOrder;
  onSortChange: ({ key }: { key: OccupationalScopeOfPracticeSortKeys }) => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({ sortKey, sortOrder, onSortChange }) => {
  const tdStyles =
    'table-header occupation-item-box-gray px-6 py-4 text-left font-strong text-bcBluePrimary border-b-4';

  const headers = [
    { label: 'Care setting', name: OccupationalScopeOfPracticeSortKeys.CARE_SETTING_NAME },
    { label: 'Care activities bundles', name: OccupationalScopeOfPracticeSortKeys.BUNDLE_NAME },
    { label: 'Care activities', name: OccupationalScopeOfPracticeSortKeys.CARE_ACTIVITY_NAME },
    { label: 'Training/certification required' },
  ];

  return (
    <thead className='border-b table-row-fixed table-header'>
      <tr className='w-full'>
        {headers.map(({ label, name }, index: number) => (
          <th key={`th${index}`} className={tdStyles}>
            <SortButton<OccupationalScopeOfPracticeSortKeys>
              label={label}
              name={name}
              sortKey={sortKey}
              sortOrder={sortOrder}
              onChange={onSortChange}
            />
          </th>
        ))}
      </tr>
    </thead>
  );
};

interface TableBodyProps {
  allowedActivities?: AllowedActivityByOccupation[];
}

const TableBody: React.FC<TableBodyProps> = ({ allowedActivities = [] }) => {
  const tdStyles = 'table-td px-6 py-2 text-left';

  return (
    <tbody>
      {allowedActivities.length === 0 && (
        <AppErrorMessage message='No care activities found with the matching filter' />
      )}

      {allowedActivities?.map((allowedActivity: AllowedActivityByOccupation, index: number) => (
        <tr
          className={`${isOdd(index) ? 'occupation-item-box-gray' : 'occupation-item-box-white'}`}
          key={`row${index}`}
        >
          <td className={tdStyles}>{allowedActivity.careSetting}</td>
          <td className={tdStyles}>{allowedActivity.bundleName}</td>
          <td className={tdStyles}>{allowedActivity.careActivityName}</td>
          <td className={tdStyles}>{'--'}</td>
        </tr>
      ))}
    </tbody>
  );
};

interface TableFooterProps {
  pageIndex: number;
  pageSize: number;
  total: number;
  onPageOptionsChange: (options: PageOptions) => void;
}

const TableFooter: React.FC<TableFooterProps> = ({
  pageSize,
  pageIndex,
  total,
  onPageOptionsChange,
}) => {
  return (
    <td colSpan={100}>
      <Pagination
        id='tbcm-occupational-scope-of-practice-list-table'
        pageOptions={{ pageIndex, pageSize, total }}
        onChange={onPageOptionsChange}
      />
    </td>
  );
};

interface OccupationalScopeOfPracticeListProps {
  searchTerm?: string;
  allowedActivities: AllowedActivityByOccupation[];
  pageIndex: number;
  pageSize: number;
  total: number;
  onPageOptionsChange: (options: PageOptions) => void;
  sortKey?: OccupationalScopeOfPracticeSortKeys;
  sortOrder?: SortOrder;
  onSortChange: ({ key }: { key: OccupationalScopeOfPracticeSortKeys }) => void;
  isLoading?: boolean;
}

export const OccupationalScopeOfPracticeList: React.FC<OccupationalScopeOfPracticeListProps> = ({
  allowedActivities,
  pageIndex,
  pageSize,
  total,
  onPageOptionsChange,
  sortKey,
  sortOrder,
  onSortChange,
  isLoading,
}) => {
  if (isLoading) {
    return <Spinner show={isLoading} />;
  }

  return (
    <table className='w-full table-auto'>
      <TableHeader sortKey={sortKey} sortOrder={sortOrder} onSortChange={onSortChange} />
      <TableBody allowedActivities={allowedActivities} />
      <TableFooter
        pageIndex={pageIndex}
        pageSize={pageSize}
        total={total}
        onPageOptionsChange={onPageOptionsChange}
      />
    </table>
  );
};
