import { Button, PageTitle } from '@components';
import { useCareLocations, useHttp } from '@services';
import { CareActivityCMSRO, OccupationCMSRO } from '@tbcm/common';
import dayjs from 'dayjs';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { AllowedPath, API_ENDPOINT } from 'src/common';
import { useAppContext } from 'src/components/AppContext';
import AppLayout from 'src/components/AppLayout';
import { BulkUploadModalCMS } from 'src/components/content-management/care-activities/bulk-upload-modal';
import { CareSettingsFilter } from 'src/components/content-management/care-activities/care-settings-filter';
import { CareActivitiesCMSList } from 'src/components/content-management/care-activities/list';
import { ContentManagementTabs } from 'src/components/content-management/ContentManagementTabs';
import { OccupationsCMSList } from 'src/components/content-management/occupations/list';
import { Card } from 'src/components/generic/Card';
import { SearchBar } from 'src/components/generic/SearchBar';
import { ModalWrapper } from 'src/components/Modal';
import { useCareActivitiesFindCMS } from 'src/services/useCareActivitiesFindCMS';
import { useCMSCareActivityDelete } from 'src/services/useCMSCareActivityDelete';
import { useOccupationsFindCMS } from 'src/services/useOccupationsFindCMS';
import { useOccupationCMSDelete } from 'src/services/useOccupationCMSDelete';
import { createDownloadSheets, triggerExcelDownload } from 'src/utils/excel-utils';

const ContentManagement: NextPage = () => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState(0);

  // Set initial tab from query parameter
  useEffect(() => {
    if (router.query.tab === 'occupations') {
      setSelectedTab(1);
    }
  }, [router.query.tab]);

  // Care Activities state and hooks
  const {
    careActivities,
    pageIndex: careActivitiesPageIndex,
    pageSize: careActivitiesPageSize,
    total: careActivitiesTotal,
    onPageOptionsChange: onCareActivitiesPageOptionsChange,
    sortKey: careActivitiesSortKey,
    sortOrder: careActivitiesSortOrder,
    onSortChange: onCareActivitiesSortChange,
    onSearchTextChange: onCareActivitiesSearchTextChange,
    careSetting,
    onCareSettingChange,
    isLoading: isLoadingCareActivities,
    onRefreshList: onRefreshCareActivities,
  } = useCareActivitiesFindCMS();

  // Occupations state and hooks
  const {
    occupations,
    pageIndex: occupationsPageIndex,
    pageSize: occupationsPageSize,
    total: occupationsTotal,
    onPageOptionsChange: onOccupationsPageOptionsChange,
    sortKey: occupationsSortKey,
    sortOrder: occupationsSortOrder,
    onSortChange: onOccupationsSortChange,
    onSearchTextChange: onOccupationsSearchTextChange,
    isLoading: isLoadingOccupations,
    onRefreshList: onRefreshOccupations,
  } = useOccupationsFindCMS();

  const { fetchData } = useHttp();
  const { updateActivePath } = useAppContext();
  const { careLocations: careSettings, isValidating: isLoadingCareLocations } = useCareLocations();

  const [showModal, setShowModal] = useState(false);
  const [currentModal, setCurrentModal] = useState<
    'delete-activity' | 'delete-occupation' | 'bulk-upload'
  >();
  const [selectedCareActivity, setSelectedCareActivity] = useState<CareActivityCMSRO>();
  const [selectedOccupation, setSelectedOccupation] = useState<OccupationCMSRO>();

  const { handleSubmit: handleSubmitDeleteCareActivity, isLoading: isLoadingDeleteCareActivity } =
    useCMSCareActivityDelete();
  const { handleSubmit: handleSubmitDeleteOccupation, isLoading: isLoadingDeleteOccupation } =
    useOccupationCMSDelete();

  // Care Activity handlers
  const onDeleteCareActivityClick = (careActivity: CareActivityCMSRO) => {
    setCurrentModal('delete-activity');
    setSelectedCareActivity(careActivity);
    setShowModal(true);
  };

  const onEditCareActivityClick = (careActivity: CareActivityCMSRO) => {
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

  // Occupation handlers
  const onDeleteOccupationClick = (occupation: OccupationCMSRO) => {
    setCurrentModal('delete-occupation');
    setSelectedOccupation(occupation);
    setShowModal(true);
  };

  const onEditOccupationClick = (occupation: OccupationCMSRO) => {
    const url = AllowedPath.CONTENT_MANAGEMENT_OCCUPATION.replace(':id', occupation.id);
    updateActivePath(url);
  };

  const onAddOccupationClick = () => {
    const url = AllowedPath.CONTENT_MANAGEMENT_OCCUPATION.replace(':id', 'new');
    updateActivePath(url);
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
                  selectedTab === 0
                    ? 'Update and remove care activities within the system. You can select to bulk update / manually update the content'
                    : 'Manage occupations and their scope of practice within the system.'
                }
              />
            </div>
          </div>

          <div className='mt-4'>
            <ContentManagementTabs selectedIndex={selectedTab} onChange={setSelectedTab} />
          </div>

          {/* Care Activities Tab */}
          {selectedTab === 0 && (
            <>
              <div className='mt-4'>
                <div className='flex gap-3 items-center justify-center'>
                  <div className='flex-1'>
                    <SearchBar
                      handleChange={e => onCareActivitiesSearchTextChange(e.target.value)}
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
                    <Button
                      loading={false}
                      onClick={onDownloadClick}
                      variant='primary'
                      type={'button'}
                    >
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
                  pageIndex={careActivitiesPageIndex}
                  pageSize={careActivitiesPageSize}
                  total={careActivitiesTotal}
                  onPageOptionsChange={onCareActivitiesPageOptionsChange}
                  sortKey={careActivitiesSortKey}
                  sortOrder={careActivitiesSortOrder}
                  onSortChange={onCareActivitiesSortChange}
                  isLoading={isLoadingCareActivities}
                  onDeleteCareActivityClick={onDeleteCareActivityClick}
                  onEditClick={onEditCareActivityClick}
                />
              </div>
            </>
          )}

          {/* Occupations Tab */}
          {selectedTab === 1 && (
            <>
              <div className='mt-4'>
                <div className='flex gap-3 items-center justify-center'>
                  <div className='flex-1'>
                    <SearchBar
                      handleChange={e => onOccupationsSearchTextChange(e.target.value)}
                      placeholderText='Search for occupations'
                    />
                  </div>

                  <div>
                    <Button
                      loading={false}
                      onClick={onAddOccupationClick}
                      variant='primary'
                      type={'button'}
                    >
                      Add Occupation
                    </Button>
                  </div>
                </div>
              </div>

              <div className='mt-4'>
                <OccupationsCMSList
                  occupations={occupations}
                  pageIndex={occupationsPageIndex}
                  pageSize={occupationsPageSize}
                  total={occupationsTotal}
                  onPageOptionsChange={onOccupationsPageOptionsChange}
                  sortKey={occupationsSortKey}
                  sortOrder={occupationsSortOrder}
                  onSortChange={onOccupationsSortChange}
                  isLoading={isLoadingOccupations}
                  onDeleteOccupationClick={onDeleteOccupationClick}
                  onEditClick={onEditOccupationClick}
                />
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Delete Care Activity Modal */}
      {showModal && selectedCareActivity && currentModal === 'delete-activity' && (
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
            isLoading: isLoadingDeleteCareActivity,
            title: 'Confirm',
            isError: true,
            onClick: () =>
              handleSubmitDeleteCareActivity(selectedCareActivity, () => {
                onRefreshCareActivities();
                setShowModal(false);
              }),
          }}
        ></ModalWrapper>
      )}

      {/* Delete Occupation Modal */}
      {showModal && selectedOccupation && currentModal === 'delete-occupation' && (
        <ModalWrapper
          isOpen={showModal}
          setIsOpen={setShowModal}
          title={'Delete occupation'}
          description={
            <>
              <div>
                <span>{`You're about to delete `}</span>
                <span className='font-bold'>{selectedOccupation.displayName}</span>
                <span>{` from the system.`}</span>
              </div>

              <div className='pt-2'>
                {`Please note that once deleted, the information can't be recovered.
                Any scope permissions associated with this occupation will also be deleted.`}
              </div>
            </>
          }
          closeButton={{ title: 'Cancel' }}
          actionButton={{
            isLoading: isLoadingDeleteOccupation,
            title: 'Confirm',
            isError: true,
            onClick: () =>
              handleSubmitDeleteOccupation(selectedOccupation, () => {
                onRefreshOccupations();
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
