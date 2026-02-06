import { OccupationsCMSFindSortKeys, OccupationCMSRO, SortOrder } from '@tbcm/common';
import { isOdd } from 'src/common/util';
import { Button } from '../../Button';
import { Spinner } from '../../generic/Spinner';
import { PageOptions, Pagination } from '../../Pagination';
import { SortButton } from '../../SortButton';
import { Tag } from '../../generic/Tag';
import { TagVariants } from 'src/common';

interface TableHeaderProps {
  sortKey?: OccupationsCMSFindSortKeys;
  sortOrder?: SortOrder;
  onSortChange: ({ key }: { key: OccupationsCMSFindSortKeys }) => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({ sortKey, sortOrder, onSortChange }) => {
  const tdStyles =
    'table-header item-box-gray px-6 py-4 text-left font-strong text-bcBluePrimary border-b-4';

  const headers = [
    { label: 'Occupations', name: OccupationsCMSFindSortKeys.DISPLAY_NAME },
    { label: 'Regulation Status', name: OccupationsCMSFindSortKeys.IS_REGULATED },
    { label: '' },
  ];

  return (
    <thead className='border-b table-row-fixed table-header'>
      <tr className='w-full'>
        {headers.map(({ label, name }, index: number) => (
          <th key={`th${index}`} className={tdStyles}>
            <SortButton<OccupationsCMSFindSortKeys>
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
  occupations?: OccupationCMSRO[];
  onDeleteOccupationClick: (occupation: OccupationCMSRO) => void;
  onEditClick: (occupation: OccupationCMSRO) => void;
}

const TableBody: React.FC<TableBodyProps> = ({
  occupations = [],
  onDeleteOccupationClick,
  onEditClick,
}) => {
  const tdStyles = 'table-td px-6 py-2 text-left';

  return (
    <tbody>
      {occupations?.map((occupation, index: number) => (
        <tr className={`${isOdd(index) ? 'item-box-gray' : 'item-box-white'}`} key={`row${index}`}>
          <td className={tdStyles}>{occupation.displayName}</td>
          <td className={tdStyles}>
            <Tag
              text={occupation.isRegulated ? 'Regulated' : 'Unregulated'}
              tagStyle={occupation.isRegulated ? TagVariants.BLUE : TagVariants.GREEN}
              className='max-w-10 h-8'
            />
          </td>
          <td className={`${tdStyles}`}>
            <div className='flex justify-end gap-4'>
              <Button variant='link' onClick={() => onEditClick(occupation)}>
                Edit
              </Button>
              <Button
                variant='link'
                classes='text-bcRedError'
                onClick={() => onDeleteOccupationClick(occupation)}
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
            id='tbcm-occupations-cms-list-table'
            pageOptions={{ pageIndex, pageSize, total }}
            onChange={onPageOptionsChange}
          />
        </td>
      </tr>
    </tfoot>
  );
};

interface OccupationsCMSListProps {
  occupations: OccupationCMSRO[];
  pageIndex: number;
  pageSize: number;
  total: number;
  onPageOptionsChange: (options: PageOptions) => void;
  sortKey?: OccupationsCMSFindSortKeys;
  sortOrder?: SortOrder;
  onSortChange: ({ key }: { key: OccupationsCMSFindSortKeys }) => void;
  isLoading?: boolean;
  onDeleteOccupationClick: (occupation: OccupationCMSRO) => void;
  onEditClick: (occupation: OccupationCMSRO) => void;
}

export const OccupationsCMSList: React.FC<OccupationsCMSListProps> = ({
  occupations,
  pageIndex,
  pageSize,
  total,
  onPageOptionsChange,
  sortKey,
  sortOrder,
  onSortChange,
  isLoading,
  onDeleteOccupationClick,
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
          occupations={occupations}
          onDeleteOccupationClick={onDeleteOccupationClick}
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
