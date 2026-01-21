import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useHttp } from '@services';
import { CareActivityBulkData, CareActivityBulkRO } from '@tbcm/common';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
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
  }, []);

  const handleErrorBeforeSelection = useCallback((selectedFile: File) => {
    resetValidationMessage();

    if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      throw new Error(
        'The file format is incorrect and cannot be uploaded to the system, please make changes to the file before re-uploading it to the dropzone above.',
      );
    }
  }, []);

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
        async ({ errors, total, add, edit, newOccupations }: CareActivityBulkRO) => {
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

        {validationMessageType && (
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
