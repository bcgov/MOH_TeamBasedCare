import { Role, RoleOptions, SortOrder, UserManagementSortKeys, UserRO } from '@tbcm/common';
import { isOdd } from 'src/common/util';
import { Spinner } from '../generic/Spinner';
import { PageOptions, Pagination } from '../Pagination';
import { SortButton } from '../SortButton';
import { useCallback } from 'react';
import { Button } from '../Button';

interface TableHeaderProps {
  sortKey?: UserManagementSortKeys;
  sortOrder?: SortOrder;
  onSortChange: ({ key }: { key: UserManagementSortKeys }) => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({ sortKey, sortOrder, onSortChange }) => {
  const tdStyles =
    'table-header item-box-gray px-6 py-4 text-left font-strong text-bcBluePrimary border-b-4';

  const headers = [
    { label: 'Email', name: UserManagementSortKeys.EMAIL },
    { label: 'Health authority', name: UserManagementSortKeys.ORGANIZATION },
    { label: 'Role' },
    { label: 'Action item' },
  ];

  return (
    <thead className='border-b table-row-fixed table-header'>
      <tr className='w-full'>
        {headers.map(({ label, name }, index: number) => (
          <th key={`th${index}`} className={tdStyles}>
            <SortButton<UserManagementSortKeys>
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
  users: UserRO[];
  onEditUserClick: (user: UserRO) => void;
}

const TableBody: React.FC<TableBodyProps> = ({ users = [], onEditUserClick }) => {
  const tdStyles = 'table-td px-6 py-2 text-left';

  const getRolesLabel = useCallback((roles: Role[] = []) => {
    return roles
      .map(role => RoleOptions.find(option => option.value === role)?.label || '')
      .join(', ');
  }, []);

  return (
    <tbody>
      {users?.map((user: UserRO, index: number) => (
        <tr className={`${isOdd(index) ? 'item-box-gray' : 'item-box-white'}`} key={`row${index}`}>
          <td className={tdStyles}>{user.email}</td>
          <td className={tdStyles}>{user.organization || '-'}</td>
          <td className={tdStyles}>{getRolesLabel(user.roles)}</td>
          <td className={`${tdStyles} flex gap-x-4`}>
            <Button variant='link' onClick={() => onEditUserClick(user)}>
              Edit
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
        id='tbcm-user-management-list-table'
        pageOptions={{ pageIndex, pageSize, total }}
        onChange={onPageOptionsChange}
      />
    </td>
  );
};

interface UserManagementListProps {
  searchTerm?: string;
  users: UserRO[];
  pageIndex: number;
  pageSize: number;
  total: number;
  onPageOptionsChange: (options: PageOptions) => void;
  sortKey?: UserManagementSortKeys;
  sortOrder?: SortOrder;
  onSortChange: ({ key }: { key: UserManagementSortKeys }) => void;
  isLoading?: boolean;
  onEditUserClick: (user: UserRO) => void;
}

export const UserManagementList: React.FC<UserManagementListProps> = ({
  users,
  pageIndex,
  pageSize,
  total,
  onPageOptionsChange,
  sortKey,
  sortOrder,
  onSortChange,
  isLoading,
  onEditUserClick,
}) => {
  if (isLoading) {
    return <Spinner show={isLoading} />;
  }

  return (
    <>
      <table className='w-full table-auto mt-2'>
        <TableHeader sortKey={sortKey} sortOrder={sortOrder} onSortChange={onSortChange} />
        <TableBody users={users} onEditUserClick={onEditUserClick} />
        <TableFooter
          pageIndex={pageIndex}
          pageSize={pageSize}
          total={total}
          onPageOptionsChange={onPageOptionsChange}
        />
      </table>
    </>
  );
};
