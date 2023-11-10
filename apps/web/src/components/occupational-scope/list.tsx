import { faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { OccupationsFindSortKeys, SortOrder } from '@tbcm/common';
import { AllowedPath, TagVariants } from 'src/common';
import { OccupationItemProps } from 'src/common/interfaces';
import { isOdd } from 'src/common/util';
import { useAppContext } from '../AppContext';
import { Button } from '../Button';
import { Spinner } from '../generic/Spinner';
import { Tag } from '../generic/Tag';
import { PageOptions, Pagination } from '../Pagination';
import { SortButton } from '../SortButton';

interface TableHeaderProps {
  sortKey?: OccupationsFindSortKeys;
  sortOrder?: SortOrder;
  onSortChange: ({ key }: { key: OccupationsFindSortKeys }) => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({ sortKey, sortOrder, onSortChange }) => {
  const tdStyles =
    'table-header occupation-item-box-gray px-6 py-4 text-left font-strong text-bcBluePrimary border-b-4';

  const headers = [
    { label: 'Occupations', name: OccupationsFindSortKeys.DISPLAY_NAME },
    { label: 'Regulation status', name: OccupationsFindSortKeys.IS_REGULATED },
    { label: '' },
  ];

  return (
    <thead className='border-b table-row-fixed table-header'>
      <tr className='w-full'>
        {headers.map(({ label, name }, index: number) => (
          <th key={`th${index}`} className={tdStyles}>
            <SortButton<OccupationsFindSortKeys>
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
  occupations?: OccupationItemProps[];
}

const TableBody: React.FC<TableBodyProps> = ({ occupations = [] }) => {
  const tdStyles = 'table-td px-6 py-2 text-left';
  const { updateActivePath } = useAppContext();

  const onViewDetailsClick = (id: string) => {
    updateActivePath(AllowedPath.OCCUPATIONAL_SCOPE_ID.replace(':id', id));
  };

  return (
    <tbody>
      {occupations?.map((occupation: OccupationItemProps, index: number) => (
        <tr
          className={`${isOdd(index) ? 'occupation-item-box-gray' : 'occupation-item-box-white'}`}
          key={`row${index}`}
        >
          <td className={tdStyles}>{occupation.name}</td>
          <td className={tdStyles}>
            <Tag
              text={occupation.isRegulated ? 'Regulated' : 'Unregulated'}
              tagStyle={occupation.isRegulated ? TagVariants.BLUE : TagVariants.GREEN}
              className='max-w-10 h-8'
            />
          </td>
          <td className={`${tdStyles} flex justify-end`}>
            <Button
              classes='gap-2 h-8'
              variant='outline'
              type='button'
              onClick={() => onViewDetailsClick(occupation.id)}
            >
              View details
              <FontAwesomeIcon icon={faAngleRight} className='h-4 text-bcBluePrimary' />
            </Button>
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
    <td colSpan={100}>
      <Pagination
        id='tbcm-occupational-scope-list-table'
        pageOptions={{ pageIndex, pageSize, total }}
        onChange={onPageOptionsChange}
      />
    </td>
  );
};

interface OccupationalScopeListProps {
  searchTerm?: string;
  occupations: OccupationItemProps[];
  pageIndex: number;
  pageSize: number;
  total: number;
  onPageOptionsChange: (options: PageOptions) => void;
  sortKey?: OccupationsFindSortKeys;
  sortOrder?: SortOrder;
  onSortChange: ({ key }: { key: OccupationsFindSortKeys }) => void;
  isLoading?: boolean;
}

export const OccupationalScopeList: React.FC<OccupationalScopeListProps> = ({
  occupations,
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
      <div> Showing {total} members. </div>
      <table className='table-auto'>
        <TableHeader sortKey={sortKey} sortOrder={sortOrder} onSortChange={onSortChange} />
        <TableBody occupations={occupations} />
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
