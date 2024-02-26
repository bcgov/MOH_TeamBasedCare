import { Button, PageTitle } from '@components';
import { NextPage } from 'next';
import { useState } from 'react';
import AppLayout from 'src/components/AppLayout';
import { ModalWrapper } from 'src/components/Modal';
import { Card } from 'src/components/generic/Card';
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

  const onAddNewClick = () => {
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
          />
        </Card>
      </div>

      {showModal && (
        <ModalWrapper isOpen={showModal} setIsOpen={setShowModal} title='Add user'>
          <div className='p-4'>
            <InviteUser
              setShowModal={setShowModal}
              successCb={() => {
                onRefreshList(); // re-fetch users
                setShowModal(false); // hide modal
              }}
            />
          </div>
        </ModalWrapper>
      )}
    </AppLayout>
  );
};

export default UserManagement;
