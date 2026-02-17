import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useHttp } from '@services';
import {
  BULK_UPLOAD_COLUMNS,
  CareActivityBulkData,
  CareActivityBulkRO,
  DuplicateHandling,
  DuplicateInfo,
  MissingIdsInfo,
  MissingOccupationsInfo,
} from '@tbcm/common';
import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';
import {
  API_ENDPOINT,
  CareActivitySheetName,
  REQUEST_METHOD,
  UploadSheetColumns,
} from 'src/common';
import { Alert } from 'src/components/Alert';
import { Button } from 'src/components/Button';
import { FileUpload } from 'src/components/FileUpload';
import { ModalWrapper } from 'src/components/Modal';
import {
  createDownloadTemplate,
  createNewWorkbook,
  triggerExcelDownload,
} from 'src/utils/excel-utils';
import { BulkUploadConfirmationModalCMS, ConfirmData } from './bulk-upload-confirmation-modal';
import { OccupationItemProps } from 'src/common/interfaces';

/** Expandable list that shows first N items with "Show all" option */
const ExpandableList: React.FC<{ items: string[]; initialCount?: number }> = ({
  items,
  initialCount = 5,
}) => {
  const [expanded, setExpanded] = useState(false);
  const displayItems = expanded ? items : items.slice(0, initialCount);
  const hasMore = items.length > initialCount;

  return (
    <ul className='mt-1 ml-4 text-sm list-disc text-gray-600'>
      {displayItems.map((item, i) => (
        <li key={`${item}-${i}`}>{item}</li>
      ))}
      {hasMore && !expanded && (
        <li>
          <button
            onClick={() => setExpanded(true)}
            className='text-bcBluePrimary underline hover:text-bcBlueLink'
          >
            Show all {items.length} items
          </button>
        </li>
      )}
      {hasMore && expanded && (
        <li>
          <button
            onClick={() => setExpanded(false)}
            className='text-bcBluePrimary underline hover:text-bcBlueLink'
          >
            Show less
          </button>
        </li>
      )}
    </ul>
  );
};

/**
 * Pending upload data preserved between chained warning flows.
 *
 * Data flow pattern: When a warning is shown, the relevant info (duplicates, missingIds)
 * is moved from pendingData to dedicated state (duplicateInfo, missingIdsInfo) for display,
 * then set to undefined here to mark it as "consumed". This prevents re-showing the same
 * warning if the user navigates back through the flow.
 */
interface PendingUploadData {
  headers: string[];
  data: CareActivityBulkData[];
  fileName: string;
  total: number;
  add?: number;
  edit?: number;
  newOccupations?: string[];
  /** Consumed when duplicates warning is shown - moved to duplicateInfo state */
  duplicates?: DuplicateInfo;
  /** Consumed when stale IDs warning is shown - moved to missingIdsInfo state */
  missingIds?: MissingIdsInfo;
  proceedWithMissingOccupations?: boolean;
  proceedWithStaleIds?: boolean;
}

interface BulkUploadModalCMSProps {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
}

export const BulkUploadModalCMS: React.FC<BulkUploadModalCMSProps> = ({
  showModal,
  setShowModal,
}) => {
  const { fetchData, sendApiRequest, isLoading } = useHttp();
  const [canConfirm, setCanConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState<ConfirmData>();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState<React.ReactElement>(<></>);
  const [validationMessageType, setValidationMessageType] = useState<'warning' | 'success'>();
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(null);
  const [showDuplicateOptions, setShowDuplicateOptions] = useState(false);
  const [missingOccupationsInfo, setMissingOccupationsInfo] =
    useState<MissingOccupationsInfo | null>(null);
  const [showMissingOccupationsWarning, setShowMissingOccupationsWarning] = useState(false);
  const [missingIdsInfo, setMissingIdsInfo] = useState<MissingIdsInfo | null>(null);
  const [showMissingIdsWarning, setShowMissingIdsWarning] = useState(false);
  const [pendingData, setPendingData] = useState<PendingUploadData | null>(null);

  const onDownloadClick = useCallback(async () => {
    const config = { endpoint: API_ENDPOINT.OCCUPATIONS };

    fetchData(
      config,
      async (occupation: OccupationItemProps[]) => {
        const xlsx = await createDownloadTemplate(occupation);

        await triggerExcelDownload(xlsx, 'care-activities-template');
      },
      'Failed to download current data',
      () => {},
    );
  }, [fetchData]);

  const resetValidationMessage = useCallback(() => {
    setValidationMessageType(undefined);
    setValidationMessage(<></>);
    setCanConfirm(false);
    setConfirmData(undefined);
    setShowConfirmModal(false);
    setDuplicateInfo(null);
    setShowDuplicateOptions(false);
    setMissingOccupationsInfo(null);
    setShowMissingOccupationsWarning(false);
    setMissingIdsInfo(null);
    setShowMissingIdsWarning(false);
    setPendingData(null);
  }, []);

  const handleErrorBeforeSelection = useCallback(
    (selectedFile: File) => {
      resetValidationMessage();

      if (
        selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        throw new Error(
          'The file format is incorrect and cannot be uploaded to the system, please make changes to the file before re-uploading it to the dropzone above.',
        );
      }
    },
    [resetValidationMessage],
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file) {
        return;
      }

      const buffer = await file.arrayBuffer();

      const workbook = createNewWorkbook();

      const careActivitiesHeaders: string[] = [];

      const careActivitiesData: CareActivityBulkData[] = [];

      try {
        await workbook.xlsx.load(buffer);
      } catch {
        throw new Error('Failed to load workbook');
      }

      let isCareActivitySheetAvailable = false;

      workbook.eachSheet((worksheet: any) => {
        // do not need to read other worksheets
        if (worksheet.name !== CareActivitySheetName) {
          return;
        }

        // care activity sheet is available
        isCareActivitySheetAvailable = true;

        // Iterate over all rows that have values in a worksheet

        worksheet.eachRow({ includeEmpty: false }, (row: any, rowNumber: number) => {
          // header row
          if (rowNumber === 1) {
            row.eachCell({ includeEmpty: false }, (cell: any) => {
              // Trim whitespace from headers to handle trailing/leading spaces
              const headerValue = typeof cell.value === 'string' ? cell.value.trim() : cell.value;
              careActivitiesHeaders.push(headerValue);
            });
            return;
          }

          // care activity rows

          const careActivityRowData: any = {};

          row.eachCell({ includeEmpty: true }, (cell: any, cellNumber: number) => {
            careActivityRowData[careActivitiesHeaders[cellNumber - 1]] =
              typeof cell.value === 'string' ? cell.value.trim() : cell.value;
          });

          // check if all columns of a row are empty [null or '' or undefined]
          if (Object.values(careActivityRowData).every(val => !val)) {
            return;
          }

          careActivitiesData.push({
            rowData: careActivityRowData,
            rowNumber,
          });
        });
      });

      if (!isCareActivitySheetAvailable) {
        throw new Error('No care activity sheet found. The excel is possibly renamed / tampered');
      }

      if (!careActivitiesHeaders.length) {
        throw new Error('Header row missing. The excel is possibly renamed / tampered');
      }

      // if all other columns - id, care unit, activities, bundle, etc are available in the sheet
      const missingHeaders = UploadSheetColumns.filter(
        c => !(careActivitiesHeaders || []).includes(c.header),
      ).map(c => c.header);

      if (missingHeaders.length > 0) {
        throw new Error(
          `The following required column headers are missing from the Excel file: ${missingHeaders.join(', ')}. Please ensure your file contains all required columns: ${UploadSheetColumns.map(c => c.header).join(', ')}.`,
        );
      }

      if (!careActivitiesData.length) {
        throw new Error('No care activities to upload');
      }

      const config = {
        method: REQUEST_METHOD.POST,
        endpoint: API_ENDPOINT.CARE_ACTIVITY_CMS_BULK_VALIDATE,
        data: {
          headers: careActivitiesHeaders,
          data: careActivitiesData,
        },
      };

      sendApiRequest(
        config,
        async ({
          errors,
          total,
          add,
          edit,
          newOccupations,
          duplicates,
          missingOccupations,
          missingIds,
        }: CareActivityBulkRO) => {
          if (errors.length > 0) {
            setValidationMessageType('warning');
            setValidationMessage(
              <div className='flex flex-col'>
                <p>
                  {`We've identified some records in the file that require attention before they can be
                integrated into the system. `}
                  <b>
                    Please review and make changes to the records carefully before dragging the file
                    into the drop zone above.
                  </b>
                </p>

                <p className='mt-4'>Issues may include but are not limited to:</p>

                <ul className='ml-4 list-disc'>
                  {errors.map(({ message, rowNumber }, index) => (
                    <li key={index}>
                      {message}{' '}
                      {rowNumber
                        ? `(#${rowNumber.slice(0, 5).join(',')}${
                            rowNumber.length > 5 ? ` & ${rowNumber.length - 5} more` : ''
                          })`
                        : ''}
                    </li>
                  ))}
                </ul>
              </div>,
            );

            return;
          }

          // Check for missing occupations and show warning with options
          if (missingOccupations && missingOccupations.count > 0) {
            setMissingOccupationsInfo(missingOccupations);
            setShowMissingOccupationsWarning(true);
            setPendingData({
              headers: careActivitiesHeaders,
              data: careActivitiesData,
              fileName: file.name,
              total,
              add,
              edit,
              newOccupations,
              duplicates, // Preserve for chained flow
              missingIds, // Preserve for chained flow
            });
            return;
          }

          // Check for stale/missing IDs and show warning with options
          if (missingIds && missingIds.count > 0) {
            setMissingIdsInfo(missingIds);
            setShowMissingIdsWarning(true);
            setPendingData({
              headers: careActivitiesHeaders,
              data: careActivitiesData,
              fileName: file.name,
              total,
              add,
              edit,
              newOccupations,
              missingIds,
              duplicates, // Preserve for chained flow
            });
            return;
          }

          // Check for duplicates and show options
          if (duplicates && duplicates.count > 0) {
            setDuplicateInfo(duplicates);
            setShowDuplicateOptions(true);
            setPendingData({
              headers: careActivitiesHeaders,
              data: careActivitiesData,
              fileName: file.name,
              total,
              add,
              edit,
              newOccupations,
            });
            return;
          }

          setValidationMessageType('success');
          setValidationMessage(
            <>
              <p>
                {'The file has been successfully processed. Click "Confirm" to '}
                <b>
                  {add ? `add ${add} care activities into the system` : ''}
                  {!!add && !!edit && ' and '}
                  {edit ? `edit ${edit} existing care activities` : ''}
                </b>
              </p>
            </>,
          );

          setCanConfirm(true);
          setConfirmData({
            headers: careActivitiesHeaders,
            data: careActivitiesData,
            fileName: file.name,
            total,
            add,
            edit,
            newOccupations,
          });
        },
        () => {},
        'Failed to validate the uploaded template',
      );
    },
    [sendApiRequest],
  );

  const handleDuplicateOption = useCallback(
    (option: DuplicateHandling) => {
      if (!pendingData) return;

      // Defensive guard: No UI button calls this with REJECT, but if future changes
      // or direct state manipulation pass REJECT, silently return rather than crash
      if (option === DuplicateHandling.REJECT) return;

      // Capture count before nulling duplicateInfo below
      const dupCount = duplicateInfo?.count || 0;

      setShowDuplicateOptions(false);
      setDuplicateInfo(null);

      const newActivitiesCount = Math.max(0, (pendingData.add || 0) - dupCount);

      if (option === DuplicateHandling.SKIP) {
        setValidationMessageType('success');
        setValidationMessage(
          <>
            <p>
              {'The file has been successfully processed. Click "Confirm" to '}
              <b>
                {newActivitiesCount > 0
                  ? `add ${newActivitiesCount} new care activities (skipping ${dupCount} duplicates)`
                  : `skip all ${dupCount} duplicate activities (nothing to add)`}
              </b>
            </p>
          </>,
        );
      } else if (option === DuplicateHandling.UPDATE) {
        setValidationMessageType('success');
        setValidationMessage(
          <>
            <p>
              {'The file has been successfully processed. Click "Confirm" to '}
              <b>
                {newActivitiesCount > 0
                  ? `add ${newActivitiesCount} new care activities and update ${dupCount} existing ones`
                  : `update ${dupCount} existing care activities`}
              </b>
            </p>
          </>,
        );
      }

      setCanConfirm(true);
      setConfirmData({
        ...pendingData,
        duplicateHandling: option,
        // proceedWithMissingOccupations is already in pendingData if set from chained flow
      });
      setPendingData(null);
    },
    [pendingData, duplicateInfo],
  );

  const handleProceedWithMissingOccupations = useCallback(() => {
    if (!pendingData) return;

    setShowMissingOccupationsWarning(false);
    setMissingOccupationsInfo(null);

    // Check for stale IDs next (chained warnings: missing occupations → stale IDs → duplicates)
    if (pendingData.missingIds && pendingData.missingIds.count > 0) {
      setMissingIdsInfo(pendingData.missingIds);
      setShowMissingIdsWarning(true);
      setPendingData({
        ...pendingData,
        proceedWithMissingOccupations: true, // Carry forward
        missingIds: undefined, // Moved to missingIdsInfo state above
      });
      return;
    }

    // Check if there are duplicates to handle next
    if (pendingData.duplicates && pendingData.duplicates.count > 0) {
      setDuplicateInfo(pendingData.duplicates);
      setShowDuplicateOptions(true);
      setPendingData({
        ...pendingData,
        proceedWithMissingOccupations: true, // Carry forward
        duplicates: undefined, // Consumed
      });
      return;
    }

    // No more warnings - proceed to confirmation
    setValidationMessageType('success');
    setValidationMessage(
      <>
        <p>
          {'The file has been successfully processed. Click "Confirm" to '}
          <b>
            {pendingData.add ? `add ${pendingData.add} care activities` : ''}
            {!!pendingData.add && !!pendingData.edit && ' and '}
            {pendingData.edit ? `edit ${pendingData.edit} existing care activities` : ''}
          </b>
          {
            '. For new activities, missing occupations will have no permission. For existing activities, their current permissions will be preserved.'
          }
        </p>
      </>,
    );

    setCanConfirm(true);
    setConfirmData({
      ...pendingData,
      proceedWithMissingOccupations: true,
    });
    setPendingData(null);
  }, [pendingData]);

  const handleProceedWithStaleIds = useCallback(() => {
    if (!pendingData || !missingIdsInfo) return;

    // Don't hide warning yet - keep it visible with disabled buttons during API call
    // It will be hidden in the success/error callbacks below

    // Strip IDs from affected rows in the data
    const modifiedData = pendingData.data.map(row => {
      if (missingIdsInfo.rowNumbers.includes(row.rowNumber)) {
        return {
          ...row,
          rowData: { ...row.rowData, [BULK_UPLOAD_COLUMNS.ID]: '' },
        };
      }
      return row;
    });

    // Re-validate with modified data to catch new duplicates
    const config = {
      method: REQUEST_METHOD.POST,
      endpoint: API_ENDPOINT.CARE_ACTIVITY_CMS_BULK_VALIDATE,
      data: { headers: pendingData.headers, data: modifiedData },
    };

    sendApiRequest(
      config,
      async ({ errors, add, edit, duplicates }: CareActivityBulkRO) => {
        // Hide the stale IDs warning now that API call completed
        setShowMissingIdsWarning(false);
        setMissingIdsInfo(null);

        if (errors.length > 0) {
          // Unexpected errors after stripping - show them
          setValidationMessageType('warning');
          setValidationMessage(
            <div className='flex flex-col'>
              <p>Unexpected validation errors after stripping IDs:</p>
              <ul className='ml-4 list-disc'>
                {errors.map(({ message, rowNumber }, index) => (
                  <li key={index}>
                    {message} {rowNumber ? `(#${rowNumber.slice(0, 5).join(',')})` : ''}
                  </li>
                ))}
              </ul>
            </div>,
          );
          return;
        }

        // Check if stripping created new duplicates
        if (duplicates && duplicates.count > 0) {
          setDuplicateInfo(duplicates);
          setShowDuplicateOptions(true);
          setPendingData({
            ...pendingData,
            data: modifiedData, // Use modified data going forward
            proceedWithStaleIds: true,
            add,
            edit, // Updated counts
          });
          return;
        }

        // No duplicates - proceed to confirmation
        setValidationMessageType('success');
        setValidationMessage(
          <>
            <p>
              {'The file has been successfully processed. Click "Confirm" to '}
              <b>
                {add ? `add ${add} care activities into the system` : ''}
                {!!add && !!edit && ' and '}
                {edit ? `edit ${edit} existing care activities` : ''}
              </b>
              {pendingData.proceedWithMissingOccupations &&
                '. For new activities, missing occupations will have no permission. For existing activities, their current permissions will be preserved.'}
            </p>
          </>,
        );

        setCanConfirm(true);
        setConfirmData({
          ...pendingData,
          data: modifiedData,
          proceedWithStaleIds: true,
          add,
          edit,
        });
        setPendingData(null);
      },
      () => {
        // Reset state so user can try again - prevents being stuck in limbo
        resetValidationMessage();
      },
      'Failed to validate after stripping IDs',
    );
  }, [pendingData, missingIdsInfo, sendApiRequest, resetValidationMessage]);

  // 1-step sync: strips IDs + sets UPDATE handling, skips re-validation round-trip
  const handleSyncStaleIds = useCallback(() => {
    if (!pendingData || !missingIdsInfo) return;

    // Strip IDs from affected rows (same as handleProceedWithStaleIds)
    const modifiedData = pendingData.data.map(row => {
      if (missingIdsInfo.rowNumbers.includes(row.rowNumber)) {
        return {
          ...row,
          rowData: { ...row.rowData, [BULK_UPLOAD_COLUMNS.ID]: '' },
        };
      }
      return row;
    });

    const matchCount = missingIdsInfo.matchingExistingCount;
    const newCount = missingIdsInfo.count - matchCount;

    // Compute correct add/edit counts for the confirmation modal:
    // - Original edit included stale rows (they had IDs) → subtract them, add back matched ones
    // - Original add was rows without IDs → add the unmatched stale rows
    const editCount = (pendingData.edit ?? 0) - missingIdsInfo.count + matchCount;
    const addCount = (pendingData.add ?? 0) + newCount;

    setShowMissingIdsWarning(false);
    setMissingIdsInfo(null);

    setValidationMessageType('success');
    setValidationMessage(
      <>
        <p>
          {'The file has been successfully processed. Click "Confirm" to '}
          <b>
            {editCount > 0
              ? `update ${editCount} existing care ${editCount === 1 ? 'activity' : 'activities'}`
              : ''}
            {editCount > 0 && addCount > 0 && ' and '}
            {addCount > 0 ? `add ${addCount} new` : ''}
          </b>
          .
          {pendingData.proceedWithMissingOccupations &&
            ' For new activities, missing occupations will have no permission. For existing activities, their current permissions will be preserved.'}
        </p>
      </>,
    );

    setCanConfirm(true);
    setConfirmData({
      ...pendingData,
      data: modifiedData,
      add: addCount,
      edit: editCount,
      proceedWithStaleIds: true,
      duplicateHandling: DuplicateHandling.UPDATE,
    });
    setPendingData(null);
  }, [pendingData, missingIdsInfo]);

  const onConfirmClick = () => {
    if (!canConfirm || !confirmData) {
      return;
    }

    setShowConfirmModal(true);
  };

  return (
    <ModalWrapper
      isOpen={showModal}
      setIsOpen={setShowModal}
      title='Bulk upload'
      closeButton={{ title: 'Back' }}
      actionButton={{ title: 'Confirm', isDisabled: !canConfirm, onClick: onConfirmClick }}
    >
      <div className='p-4'>
        <div>
          Download and utilize the content configuration template for updates. Once you finish
          updating, upload the file to sync content to the database.
        </div>
        <ol className='list-decimal ml-4 pl-4 my-2 text-md'>
          <li>
            To add a new care activity, add a new row without <b>ID.</b>
          </li>
          <li>To edit or delete, use buttons on Care Activity table.</li>
        </ol>

        <div className='mt-4'>
          <Button
            variant='link'
            disabled={isLoading}
            classes='w-full bg-bcLightGray text-bcBlueLink'
            onClick={() => onDownloadClick()}
          >
            <div className='flex flex-row p-4 items-center'>
              <FontAwesomeIcon icon={faDownload} className='h-4 text-bcBluePrimary mr-4' />
              Download template .xlsx
            </div>
          </Button>
        </div>

        <div className='mt-4'>
          <FileUpload
            id='bulk-upload-modal'
            accept='.xlsx'
            handleErrorBeforeSelection={handleErrorBeforeSelection}
            handleFile={handleFileUpload}
            handleFileErrorRemove={resetValidationMessage}
            loading={isLoading}
          />
        </div>

        {showMissingOccupationsWarning && missingOccupationsInfo && (
          <Alert type='warning' className='mt-4'>
            <div className='flex flex-col'>
              <p>
                <b>Your template is missing {missingOccupationsInfo.count} occupation column(s).</b>
              </p>
              <p className='mt-2 text-sm text-gray-600'>
                The following occupations exist in the system but are not in your uploaded file:
              </p>
              <ExpandableList items={missingOccupationsInfo.names} />
              <p className='mt-3 text-sm text-gray-600'>
                <b>If you proceed:</b> For new activities, these occupations will have no
                permission. For existing activities, their current permissions will be preserved.
                You can edit permissions later on the Content Management page.
              </p>
              <p className='mt-3 font-medium'>What would you like to do?</p>
              <div className='flex gap-2 mt-3'>
                <Button variant='primary' onClick={handleProceedWithMissingOccupations}>
                  Proceed anyway
                </Button>
                <Button variant='outline' onClick={resetValidationMessage}>
                  Cancel
                </Button>
              </div>
            </div>
          </Alert>
        )}

        {showMissingIdsWarning && missingIdsInfo && (
          <Alert type='warning' className='mt-4'>
            <div className='flex flex-col'>
              <p>
                <b>
                  {missingIdsInfo.count} activities have IDs that don&apos;t exist in this system.
                </b>
              </p>
              <p className='mt-2 text-sm text-gray-600'>
                This usually happens when using a template from a different environment or after
                database changes. The following activities are affected:
              </p>
              <ExpandableList items={missingIdsInfo.names} />

              {missingIdsInfo.matchingExistingCount > 0 ? (
                <p className='mt-3 text-sm text-gray-600'>
                  <b>
                    {missingIdsInfo.matchingExistingCount} of {missingIdsInfo.count}
                  </b>{' '}
                  match existing activities by name.
                  {missingIdsInfo.count - missingIdsInfo.matchingExistingCount > 0 && (
                    <>
                      {' '}
                      The remaining{' '}
                      <b>{missingIdsInfo.count - missingIdsInfo.matchingExistingCount}</b> will be
                      added as new.
                    </>
                  )}
                </p>
              ) : (
                <p className='mt-3 text-sm text-gray-600'>
                  <b>If you proceed:</b> The IDs will be removed and these activities will be added
                  as new records (they may become duplicates if activities with the same name
                  exist).
                </p>
              )}

              <p className='mt-3 font-medium'>What would you like to do?</p>
              <div className='flex gap-2 mt-3'>
                {missingIdsInfo.matchingExistingCount > 0 && (
                  <Button variant='primary' onClick={handleSyncStaleIds} disabled={isLoading}>
                    Sync ({missingIdsInfo.matchingExistingCount}{' '}
                    {missingIdsInfo.matchingExistingCount === 1 ? 'update' : 'updates'}
                    {missingIdsInfo.count - missingIdsInfo.matchingExistingCount > 0 &&
                      `, ${missingIdsInfo.count - missingIdsInfo.matchingExistingCount} new`}
                    )
                  </Button>
                )}
                <Button
                  variant={missingIdsInfo.matchingExistingCount > 0 ? 'outline' : 'primary'}
                  onClick={handleProceedWithStaleIds}
                  disabled={isLoading}
                >
                  {isLoading ? 'Validating...' : 'Strip IDs and review'}
                </Button>
                <Button variant='outline' onClick={resetValidationMessage} disabled={isLoading}>
                  Cancel
                </Button>
              </div>
            </div>
          </Alert>
        )}

        {showDuplicateOptions && duplicateInfo && (
          <Alert type='warning' className='mt-4'>
            <div className='flex flex-col'>
              <p>
                <b>{duplicateInfo.count} care activities already exist in the system.</b>
              </p>
              <p className='mt-2 text-sm text-gray-600'>
                These activities already exist in the system. You can skip them, or update their
                details with the values from your file:
              </p>
              <ExpandableList items={duplicateInfo.names} />
              <p className='mt-3 font-medium'>What would you like to do?</p>
              <div className='flex gap-2 mt-3'>
                <Button
                  variant='primary'
                  onClick={() => handleDuplicateOption(DuplicateHandling.SKIP)}
                >
                  Skip duplicates
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => handleDuplicateOption(DuplicateHandling.UPDATE)}
                >
                  Update existing
                </Button>
                <Button variant='outline' onClick={resetValidationMessage}>
                  Cancel
                </Button>
              </div>
            </div>
          </Alert>
        )}

        {validationMessageType &&
          !showDuplicateOptions &&
          !showMissingOccupationsWarning &&
          !showMissingIdsWarning && (
            <Alert type={validationMessageType} className='mt-4'>
              {validationMessage}
            </Alert>
          )}

        <BulkUploadConfirmationModalCMS
          showModal={showConfirmModal}
          setShowModal={setShowConfirmModal}
          setUploadModal={setShowModal}
          confirmData={confirmData}
        />
      </div>
    </ModalWrapper>
  );
};
