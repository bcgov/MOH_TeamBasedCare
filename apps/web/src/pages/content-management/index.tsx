import { PageTitle } from '@components';
import { NextPage } from 'next';
import AppLayout from 'src/components/AppLayout';
import { CareActivitiesCMSList } from 'src/components/content-management/care-activities/list';
import { Card } from 'src/components/generic/Card';
import { useCareActivitiesFindCMS } from 'src/services/useCareActivitiesFindCMS';

const ContentManagement: NextPage = () => {
  const {
    careActivities,
    pageIndex,
    pageSize,
    total,
    onPageOptionsChange,
    sortKey,
    sortOrder,
    onSortChange,
    isLoading,
  } = useCareActivitiesFindCMS();

  return (
    <AppLayout>
      <div className='flex flex-1 flex-col gap-3 mt-5'>
        <Card bgWhite>
          <div className='flex space-x-4 items-center'>
            <div className='flex-1'>
              <PageTitle
                title='Content management portal'
                description={
                  'Update and remove care activities within the system. You can select to bulk update / manually update the content'
                }
              />
            </div>
          </div>

          <div className='mt-4'>
            <CareActivitiesCMSList
              careActivities={careActivities}
              pageIndex={pageIndex}
              pageSize={pageSize}
              total={total}
              onPageOptionsChange={onPageOptionsChange}
              sortKey={sortKey}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
              isLoading={isLoading}
            />
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ContentManagement;
