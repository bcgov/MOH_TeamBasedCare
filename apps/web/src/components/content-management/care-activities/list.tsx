import { CareActivitiesCMSFindSortKeys, CareActivityCMSRO, SortOrder } from '@tbcm/common';
import { isOdd } from 'src/common/util';
import { Button } from '../../Button';
import { Spinner } from '../../generic/Spinner';
import { PageOptions, Pagination } from '../../Pagination';
import { SortButton } from '../../SortButton';

interface TableHeaderProps {
  sortKey?: CareActivitiesCMSFindSortKeys;
  sortOrder?: SortOrder;
  onSortChange: ({ key }: { key: CareActivitiesCMSFindSortKeys }) => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({ sortKey, sortOrder, onSortChange }) => {
  const tdStyles =
    'table-header item-box-gray px-6 py-4 text-left font-strong text-bcBluePrimary border-b-4';

  const headers = [
    { label: 'Care activities', name: CareActivitiesCMSFindSortKeys.DISPLAY_NAME },
    { label: 'Care Setting', name: CareActivitiesCMSFindSortKeys.CARE_SETTING_NAME },
    { label: 'Bundle', name: CareActivitiesCMSFindSortKeys.BUNDLE_NAME },
    { label: 'Last updated by', name: CareActivitiesCMSFindSortKeys.UPDATED_BY },
    { label: '' },
  ];

  return (
    <thead className='border-b table-row-fixed table-header'>
      <tr className='w-full'>
        {headers.map(({ label, name }, index: number) => (
          <th key={`th${index}`} className={tdStyles}>
            <SortButton<CareActivitiesCMSFindSortKeys>
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
  careActivities?: CareActivityCMSRO[];
  onDeleteCareActivityClick: (careActivity: CareActivityCMSRO) => void;
  onEditClick: (careActivity: CareActivityCMSRO) => void;
}

const TableBody: React.FC<TableBodyProps> = ({
  careActivities = [],
  onDeleteCareActivityClick,
  onEditClick,
}) => {
  const tdStyles = 'table-td px-6 py-2 text-left';

  return (
    <tbody>
      {careActivities?.map((careActivity, index: number) => (
        <tr className={`${isOdd(index) ? 'item-box-gray' : 'item-box-white'}`} key={`row${index}`}>
          <td className={tdStyles}>{careActivity.name}</td>
          <td className={tdStyles}>{careActivity.unitName || '-'}</td>
          <td className={tdStyles}>{careActivity.bundleName || '-'}</td>
          <td className={tdStyles}>{careActivity.updatedBy || '-'}</td>
          <td className={`${tdStyles}`}>
            <div className='flex justify-end gap-4'>
              <Button variant='link' onClick={() => onEditClick(careActivity)}>
                Edit
              </Button>
              <Button
                variant='link'
                classes='text-bcRedError'
                onClick={() => onDeleteCareActivityClick(careActivity)}
              >
                Delete
              </Button>
            </div>
          </td>
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
    <tfoot>
      <tr>
        <td colSpan={100}>
          <Pagination
            id='tbcm-care-terminologies-list-table'
            pageOptions={{ pageIndex, pageSize, total }}
            onChange={onPageOptionsChange}
          />
        </td>
      </tr>
    </tfoot>
  );
};

interface CareActivitiesCMSListProps {
  careActivities: CareActivityCMSRO[];
  pageIndex: number;
  pageSize: number;
  total: number;
  onPageOptionsChange: (options: PageOptions) => void;
  sortKey?: CareActivitiesCMSFindSortKeys;
  sortOrder?: SortOrder;
  onSortChange: ({ key }: { key: CareActivitiesCMSFindSortKeys }) => void;
  isLoading?: boolean;
  onDeleteCareActivityClick: (careActivity: CareActivityCMSRO) => void;
  onEditClick: (careActivity: CareActivityCMSRO) => void;
}

export const CareActivitiesCMSList: React.FC<CareActivitiesCMSListProps> = ({
  careActivities,
  pageIndex,
  pageSize,
  total,
  onPageOptionsChange,
  sortKey,
  sortOrder,
  onSortChange,
  isLoading,
  onDeleteCareActivityClick,
  onEditClick,
}) => {
  if (isLoading) {
    return <Spinner show={isLoading} />;
  }

  return (
    <div className='max-h-full w-full flex-1 flex flex-col overflow-auto gap-3 bg-white'>
      <table className='table-auto'>
        <TableHeader sortKey={sortKey} sortOrder={sortOrder} onSortChange={onSortChange} />
        <TableBody
          careActivities={careActivities}
          onDeleteCareActivityClick={onDeleteCareActivityClick}
          onEditClick={onEditClick}
        />
        <TableFooter
          pageIndex={pageIndex}
          pageSize={pageSize}
          total={total}
          onPageOptionsChange={onPageOptionsChange}
        />
      </table>
    </div>
  );
};
