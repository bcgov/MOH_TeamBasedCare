import { faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CareActivitiesFindSortKeys, CareActivityRO, SortOrder } from '@tbcm/common';
import { AllowedPath } from 'src/common';
import { isOdd } from 'src/common/util';
import { useAppContext } from '../AppContext';
import { Button } from '../Button';
import { Spinner } from '../generic/Spinner';
import { PageOptions, Pagination } from '../Pagination';
import { SortButton } from '../SortButton';

interface TableHeaderProps {
  sortKey?: CareActivitiesFindSortKeys;
  sortOrder?: SortOrder;
  onSortChange: ({ key }: { key: CareActivitiesFindSortKeys }) => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({ sortKey, sortOrder, onSortChange }) => {
  const tdStyles =
    'table-header item-box-gray px-6 py-4 text-left font-strong text-bcBluePrimary border-b-4';

  const headers = [
    { label: 'Care activities', name: CareActivitiesFindSortKeys.DISPLAY_NAME },
    { label: '' },
  ];

  return (
    <thead className='border-b table-row-fixed table-header'>
      <tr className='w-full'>
        {headers.map(({ label, name }, index: number) => (
          <th key={`th${index}`} className={tdStyles}>
            <SortButton<CareActivitiesFindSortKeys>
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
  careActivities?: CareActivityRO[];
}

const TableBody: React.FC<TableBodyProps> = ({ careActivities = [] }) => {
  const tdStyles = 'table-td px-6 py-2 text-left';
  const { updateActivePath } = useAppContext();

  const onViewDetailsClick = (id: string) => {
    updateActivePath(AllowedPath.CARE_TERMINOLOGIES_ID.replace(':id', id));
  };

  return (
    <tbody>
      {careActivities?.map((careActivity: CareActivityRO, index: number) => (
        <tr className={`${isOdd(index) ? 'item-box-gray' : 'item-box-white'}`} key={`row${index}`}>
          <td className={tdStyles}>{careActivity.name}</td>
          <td className={`${tdStyles} whitespace-nowrap`}>
            <div className='flex justify-end'>
              <Button
                classes='gap-2 h-8 min-w-[112px] whitespace-nowrap'
                variant='outline'
                type='button'
                onClick={() => onViewDetailsClick(careActivity.id)}
              >
                View details
                <FontAwesomeIcon icon={faAngleRight} className='h-4 w-4 text-bcBluePrimary' />
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
        <td colSpan={2}>
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

interface CareTerminologiesListProps {
  searchTerm?: string;
  careActivities: CareActivityRO[];
  pageIndex: number;
  pageSize: number;
  total: number;
  onPageOptionsChange: (options: PageOptions) => void;
  sortKey?: CareActivitiesFindSortKeys;
  sortOrder?: SortOrder;
  onSortChange: ({ key }: { key: CareActivitiesFindSortKeys }) => void;
  isLoading?: boolean;
}

export const CareTerminologiesList: React.FC<CareTerminologiesListProps> = ({
  careActivities,
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
    <div className='max-h-full w-full flex-1 flex flex-col overflow-auto gap-3 p-4 bg-white'>
      <div>Filter By Alphabet, and you can change the setting based on preferences</div>
      <table className='w-full table-fixed'>
        <colgroup>
          <col style={{ width: '75%' }} />
          <col style={{ width: '25%' }} />
        </colgroup>
        <TableHeader sortKey={sortKey} sortOrder={sortOrder} onSortChange={onSortChange} />
        <TableBody careActivities={careActivities} />
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
