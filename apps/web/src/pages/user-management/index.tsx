import { Button, PageTitle } from '@components';
import { useAuth } from '@services';
import { UserRO } from '@tbcm/common';
import { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AppLayout from 'src/components/AppLayout';
import { ModalWrapper } from 'src/components/Modal';
import { Card } from 'src/components/generic/Card';
import { EditUser } from 'src/components/user-management/editUser';
import { InviteUser } from 'src/components/user-management/inviteUser';
import { UserManagementList } from 'src/components/user-management/list';
import { UserManagementSearch } from 'src/components/user-management/search';
import { useUserReProvision } from 'src/services/useUserReProvision';
import { useUserRevoke } from 'src/services/useUserRevoke';
import { useUsersFind } from 'src/services/useUsersFind';

const UserManagement: NextPage = () => {
  const {
    users,
    pageIndex,
    pageSize,
    total,
    onPageOptionsChange,
    sortKey,
    sortOrder,
    onSortChange,
    onSearchTextChange,
    isLoading,
    onRefreshList,
  } = useUsersFind();

  const [showModal, setShowModal] = useState(false);
  const [currentModal, setCurrentModal] = useState<'invite' | 'edit' | 'revoke' | 're-provision'>();
  const [modalTitle, setModalTitle] = useState<string>();
  const [selectedUser, setSelectedUser] = useState<UserRO>();

  const { handleSubmit: handleSubmitRevoke, isLoading: isLoadingRevoke } = useUserRevoke();
  const { handleSubmit: handleSubmitReProvision, isLoading: isLoadingReProvision } =
    useUserReProvision();
  const { isLoggedInUser } = useAuth();

  useEffect(() => {
    if (currentModal === 'invite') {
      setModalTitle('Add User');
    }

    if (currentModal === 'edit') {
      setModalTitle('Edit User');
    }
  }, [currentModal]);

  const onAddNewClick = () => {
    setCurrentModal('invite');
    setShowModal(true);
  };

  const onEditUserClick = (user: UserRO) => {
    if (isLoggedInUser(user)) {
      toast.error('Failed to edit self user.');
      return;
    }

    setCurrentModal('edit');
    setSelectedUser(user);
    setShowModal(true);
  };

  const onRevokeUserClick = (user: UserRO) => {
    if (isLoggedInUser(user)) {
      toast.error('Failed to revoke self user access.');
      return;
    }

    setCurrentModal('revoke');
    setSelectedUser(user);
    setShowModal(true);
  };

  const onReProvisionUserClick = (user: UserRO) => {
    if (isLoggedInUser(user)) {
      toast.error('Failed to re-provision self user access.');
      return;
    }

    setCurrentModal('re-provision');
    setSelectedUser(user);
    setShowModal(true);
  };

  return (
    <AppLayout>
      <div className='flex flex-1 flex-col gap-3 mt-5'>
        <Card bgWhite>
          <div className='flex space-x-4 items-center'>
            <div className='flex-1'>
              <PageTitle
                title='User management'
                description={
                  'You can add/update the list of user get access to this application, also assigning them with the role as regular users, and Health authority admin for management'
                }
              />
            </div>
            <Button variant='primary' type='button' classes={`px-8`} onClick={onAddNewClick}>
              Add user
            </Button>
          </div>
        </Card>

        <Card bgWhite className='mt-4'>
          <PageTitle
            title='Users'
            secondary={<UserManagementSearch onSearchTextChange={onSearchTextChange} />}
          />
          <UserManagementList
            users={users}
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={total}
            onPageOptionsChange={onPageOptionsChange}
            sortKey={sortKey}
            sortOrder={sortOrder}
            onSortChange={onSortChange}
            isLoading={isLoading}
            onEditUserClick={onEditUserClick}
            onRevokeUserClick={onRevokeUserClick}
            onReProvisionUserClick={onReProvisionUserClick}
          />
        </Card>
      </div>

      {showModal && currentModal && ['invite', 'edit'].includes(currentModal) && (
        <ModalWrapper isOpen={showModal} setIsOpen={setShowModal} title={modalTitle}>
          <div className='p-4'>
            {currentModal === 'invite' && (
              <InviteUser
                setShowModal={setShowModal}
                successCb={() => {
                  onRefreshList(); // re-fetch users
                  setShowModal(false); // hide modal
                }}
              />
            )}

            {currentModal === 'edit' && selectedUser && (
              <EditUser
                user={selectedUser}
                setShowModal={setShowModal}
                successCb={() => {
                  onRefreshList(); // re-fetch users
                  setShowModal(false); // hide modal
                }}
              />
            )}
          </div>
        </ModalWrapper>
      )}

      {showModal && selectedUser && currentModal === 'revoke' && (
        <ModalWrapper
          isOpen={showModal}
          setIsOpen={setShowModal}
          title={'Revoke access'}
          description={
            <>
              Are you sure you want to revoke access for
              <span className='pl-1 font-bold'>
                <span className={'text-bcBlueLink underline'}>{selectedUser.email}</span>
                {selectedUser.displayName ? ` (${selectedUser.displayName})` : ''} ?
              </span>
            </>
          }
          closeButton={{ title: 'Cancel' }}
          actionButton={{
            isLoading: isLoadingRevoke,
            title: 'Confirm',
            onClick: () =>
              handleSubmitRevoke(selectedUser, () => {
                onRefreshList();
                setShowModal(false);
              }),
          }}
        ></ModalWrapper>
      )}

      {showModal && selectedUser && currentModal === 're-provision' && (
        <ModalWrapper
          isOpen={showModal}
          setIsOpen={setShowModal}
          title={'Re-provision access'}
          description={
            <>
              Are you sure you want to re-provision access for
              <span className='pl-1 font-bold'>
                <span className={'text-bcBlueLink underline'}>{selectedUser.email}</span>
                {selectedUser.displayName ? ` (${selectedUser.displayName})` : ''} ?
              </span>
            </>
          }
          closeButton={{ title: 'Cancel' }}
          actionButton={{
            isLoading: isLoadingReProvision,
            title: 'Confirm',
            onClick: () =>
              handleSubmitReProvision(selectedUser, () => {
                onRefreshList();
                setShowModal(false);
              }),
          }}
        ></ModalWrapper>
      )}
    </AppLayout>
  );
};

export default UserManagement;
