import { PageTitle } from '@components';
import { useCareLocations } from '@services';
import { NextPage } from 'next';
import AppLayout from 'src/components/AppLayout';
import { CareSettingsFilter } from 'src/components/content-management/care-activities/care-settings-filter';
import { CareActivitiesCMSList } from 'src/components/content-management/care-activities/list';
import { CareActivitiesCMSSearch } from 'src/components/content-management/care-activities/search';
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
    onSearchTextChange,
    careSetting,
    onCareSettingChange,
    isLoading,
  } = useCareActivitiesFindCMS();

  const { careLocations: careSettings, isLoading: isLoadingCareLocations } = useCareLocations();

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
            <div className='flex gap-3 items-center justify-center'>
              <div className='flex-1'>
                <CareActivitiesCMSSearch onSearchTextChange={onSearchTextChange} />
              </div>

              <div>
                <CareSettingsFilter
                  isLoading={isLoadingCareLocations}
                  options={careSettings}
                  careSetting={careSetting}
                  onCareSettingChange={onCareSettingChange}
                />
              </div>
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
