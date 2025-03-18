import { Button, PageTitle } from '@components';
import { useCareLocations, useHttp } from '@services';
import { CareActivityCMSRO } from '@tbcm/common';
import dayjs from 'dayjs';
import { NextPage } from 'next';
import { useState } from 'react';
import { AllowedPath, API_ENDPOINT } from 'src/common';
import { useAppContext } from 'src/components/AppContext';
import AppLayout from 'src/components/AppLayout';
import { BulkUploadModalCMS } from 'src/components/content-management/care-activities/bulk-upload-modal';
import { CareSettingsFilter } from 'src/components/content-management/care-activities/care-settings-filter';
import { CareActivitiesCMSList } from 'src/components/content-management/care-activities/list';
import { Card } from 'src/components/generic/Card';
import { SearchBar } from 'src/components/generic/SearchBar';
import { ModalWrapper } from 'src/components/Modal';
import { useCareActivitiesFindCMS } from 'src/services/useCareActivitiesFindCMS';
import { useCMSCareActivityDelete } from 'src/services/useCMSCareActivityDelete';
import { createDownloadSheets, triggerExcelDownload } from 'src/utils/excel-utils';

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
    onRefreshList,
  } = useCareActivitiesFindCMS();
  const { fetchData } = useHttp();
  const { updateActivePath } = useAppContext();
  const { careLocations: careSettings, isValidating: isLoadingCareLocations } = useCareLocations();

  const [showModal, setShowModal] = useState(false);
  const [currentModal, setCurrentModal] = useState<'delete' | 'bulk-upload'>();
  const [selectedCareActivity, setSelectedCareActivity] = useState<CareActivityCMSRO>();

  const { handleSubmit: handleSubmitDelete, isLoading: isLoadingDelete } =
    useCMSCareActivityDelete();

  const onDeleteCareActivityClick = (careActivity: CareActivityCMSRO) => {
    setCurrentModal('delete');
    setSelectedCareActivity(careActivity);
    setShowModal(true);
  };

  const onEditClick = (careActivity: CareActivityCMSRO) => {
    const url = AllowedPath.CONTENT_MANAGEMENT_CARE_ACTIVITY.replace(':id', careActivity.id);
    updateActivePath(`${url}?unitId=${careActivity.unitId}`);
  };

  const onBulkUploadClick = () => {
    setCurrentModal('bulk-upload');
    setShowModal(true);
  };

  const onDownloadClick = () => {
    const config = { endpoint: API_ENDPOINT.CARE_ACTIVITY_DOWNLOAD };

    fetchData(
      config,
      async (careActivities: Record<string, string>[]) => {
        const xlsx = await createDownloadSheets(careActivities);

        await triggerExcelDownload(xlsx, `care-activities-${dayjs().format('YYYY-MM-DD')}`);
      },
      'Failed to download current data',
      () => {},
    );
  };

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
                <SearchBar
                  handleChange={e => onSearchTextChange(e.target.value)}
                  placeholderText='Search for care activities'
                />
              </div>

              <div>
                <CareSettingsFilter
                  isLoading={isLoadingCareLocations}
                  options={careSettings}
                  careSetting={careSetting}
                  onCareSettingChange={onCareSettingChange}
                />
              </div>

              <div>
                <Button loading={false} onClick={onDownloadClick} variant='primary' type={'button'}>
                  Download
                </Button>
              </div>
              <div>
                <Button
                  loading={false}
                  onClick={onBulkUploadClick}
                  variant='primary'
                  type={'button'}
                >
                  Bulk upload
                </Button>
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
              onDeleteCareActivityClick={onDeleteCareActivityClick}
              onEditClick={onEditClick}
            />
          </div>
        </Card>
      </div>

      {showModal && selectedCareActivity && currentModal === 'delete' && (
        <ModalWrapper
          isOpen={showModal}
          setIsOpen={setShowModal}
          title={'Delete care activity'}
          description={
            <>
              <div>
                <span>{`You're about to delete `}</span>
                <span className='font-bold'>{selectedCareActivity.name}</span>
                <span>{` from the system.`}</span>
              </div>

              <div className='pt-2'>
                {`Please note that once deleted, the information can't be recovered. 
                Other plans or documentation containing this care activity might be affected as well.`}
              </div>
            </>
          }
          closeButton={{ title: 'Cancel' }}
          actionButton={{
            isLoading: isLoadingDelete,
            title: 'Confirm',
            isError: true,
            onClick: () =>
              handleSubmitDelete(selectedCareActivity, () => {
                onRefreshList();
                setShowModal(false);
              }),
          }}
        ></ModalWrapper>
      )}

      {showModal && currentModal === 'bulk-upload' && (
        <BulkUploadModalCMS showModal={showModal} setShowModal={setShowModal} />
      )}
    </AppLayout>
  );
};

export default ContentManagement;
