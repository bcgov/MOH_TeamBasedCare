import { Button, PageTitle } from '@components';
import { UserRO } from '@tbcm/common';
import { NextPage } from 'next';
import { useEffect, useState } from 'react';
import AppLayout from 'src/components/AppLayout';
import { ModalWrapper } from 'src/components/Modal';
import { Card } from 'src/components/generic/Card';
import { EditUser } from 'src/components/user-management/editUser';
import { InviteUser } from 'src/components/user-management/inviteUser';
import { UserManagementList } from 'src/components/user-management/list';
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
    isLoading,
    onRefreshList,
  } = useUsersFind();

  const [showModal, setShowModal] = useState(false);
  const [currentModal, setCurrentModal] = useState<'invite' | 'edit'>();
  const [modalTitle, setModalTitle] = useState<string>();
  const [selectedUser, setSelectedUser] = useState<UserRO>();

  useEffect(() => {
    if (currentModal === 'invite') {
      setModalTitle('Invite User');
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
    setCurrentModal('edit');
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
              Add new
            </Button>
          </div>
        </Card>

        <Card bgWhite className='mt-4'>
          <PageTitle title='Users' />
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
          />
        </Card>
      </div>

      {showModal && (
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
    </AppLayout>
  );
};

export default UserManagement;
