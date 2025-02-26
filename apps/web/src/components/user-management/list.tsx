import {
  Role,
  RoleOptions,
  SortOrder,
  UserManagementSortKeys,
  UserRO,
  UserStatus,
  UserStatusOptions,
} from '@tbcm/common';
import { isOdd } from 'src/common/util';
import { Spinner } from '../generic/Spinner';
import { PageOptions, Pagination } from '../Pagination';
import { SortButton } from '../SortButton';
import { useCallback } from 'react';
import { Button } from '../Button';
import { Tag } from '../generic/Tag';
import { RoleTagVariant, TagVariants } from 'src/common';
import { useMe } from '@services';

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
    { label: 'Status' },
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
  onRevokeUserClick: (user: UserRO) => void;
  onReProvisionUserClick: (user: UserRO) => void;
}

const TableBody: React.FC<TableBodyProps> = ({
  users = [],
  onEditUserClick,
  onRevokeUserClick,
  onReProvisionUserClick,
}) => {
  const tdStyles = 'table-td px-6 py-2 text-left';

  const { me } = useMe();

  const getRoles = useCallback((roles: Role[] = []) => {
    return roles.sort().map(role => RoleOptions.find(option => option.value === role));
  }, []);

  const getStatusOption = useCallback((status: UserStatus) => {
    return UserStatusOptions.find(option => option.value === status);
  }, []);

  const getStatusLabel = useCallback(
    (status: UserStatus) => {
      return getStatusOption(status)?.label || '';
    },
    [getStatusOption],
  );

  const getStatusColor = useCallback(
    (status: UserStatus) => {
      return getStatusOption(status)?.color || '';
    },
    [getStatusOption],
  );

  return (
    <tbody>
      {users?.map((user: UserRO, index: number) => (
        <tr className={`${isOdd(index) ? 'item-box-gray' : 'item-box-white'}`} key={`row${index}`}>
          <td className={tdStyles}>{user.email}</td>
          <td className={tdStyles}>{user.organization || '-'}</td>
          <td className={`${tdStyles} flex flex-row`}>
            {getRoles(user.roles).map(role => (
              <Tag
                key={role?.value}
                tagStyle={role?.value ? RoleTagVariant[role.value] : TagVariants.GRAY}
                text={role?.label || ''}
              />
            ))}
          </td>
          <td
            className={`${tdStyles} font-bold ${
              getStatusColor(user.status) === 'red'
                ? 'text-bcRedError'
                : getStatusColor(user.status) === 'yellow'
                ? 'text-bcYellowWarning'
                : getStatusColor(user.status) === 'green'
                ? 'text-bcGreenHiredText'
                : getStatusColor(user.status) === 'blue'
                ? 'text-bcBlueAccent'
                : ''
            }`}
          >
            {getStatusLabel(user.status)}
          </td>
          <td className={`${tdStyles} flex gap-x-4`}>
            {me?.id !== user.id && (
              <Button variant='link' onClick={() => onEditUserClick(user)}>
                Edit
              </Button>
            )}
            {user.status !== UserStatus.REVOKED && me?.id !== user.id && (
              <Button variant='link' onClick={() => onRevokeUserClick(user)}>
                Revoke access
              </Button>
            )}
            {user.status === UserStatus.REVOKED && me?.id !== user.id && (
              <Button variant='link' onClick={() => onReProvisionUserClick(user)}>
                Re-provision access
              </Button>
            )}
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
            id='tbcm-user-management-list-table'
            pageOptions={{ pageIndex, pageSize, total }}
            onChange={onPageOptionsChange}
          />
        </td>
      </tr>
    </tfoot>
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
  onRevokeUserClick: (user: UserRO) => void;
  onReProvisionUserClick: (user: UserRO) => void;
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
  onRevokeUserClick,
  onReProvisionUserClick,
}) => {
  if (isLoading) {
    return <Spinner show={isLoading} />;
  }

  return (
    <>
      <table className='w-full table-auto mt-2'>
        <TableHeader sortKey={sortKey} sortOrder={sortOrder} onSortChange={onSortChange} />
        <TableBody
          users={users}
          onEditUserClick={onEditUserClick}
          onRevokeUserClick={onRevokeUserClick}
          onReProvisionUserClick={onReProvisionUserClick}
        />
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
