import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useHttp } from '@services';
import {
  BULK_UPLOAD_ALLOWED_PERMISSIONS,
  CareActivityBulkData,
  CareActivityBulkRO,
  CareActivityType,
} from '@tbcm/common';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { API_ENDPOINT, REQUEST_METHOD, UploadSheetColumns } from 'src/common';
import { Alert } from 'src/components/Alert';
import { Button } from 'src/components/Button';
import { FileUpload } from 'src/components/FileUpload';
import { ModalWrapper } from 'src/components/Modal';
import {
  addLegendWorksheet,
  conditionalFormattingRules,
  createNewWorkbook,
  emptyGrayConditionalFormattingRules,
  getExcelColumnName,
  HeaderColumns,
  headerStyle,
  triggerExcelDownload,
} from 'src/utils/excel-utils';
import { BulkUploadConfirmationModalCMS, ConfirmData } from './bulk-upload-confirmation-modal';
import dayjs from 'dayjs';

interface BulkUploadModalCMSProps {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
}

const CARE_ACTIVITY_SHEET_NAME = 'Care_Activities';

export const BulkUploadModalCMS: React.FC<BulkUploadModalCMSProps> = ({
  showModal,
  setShowModal,
}) => {
  const { fetchData, sendApiRequest, isLoading } = useHttp();
  const [canConfirm, setCanConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState<ConfirmData>();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState<JSX.Element>(<></>);
  const [validationMessageType, setValidationMessageType] = useState<'warning' | 'success'>();

  const createSheets = useCallback(async (activities: Record<string, string>[]) => {
    const workbook = createNewWorkbook();

    // add upload worksheet
    const gapMatrixWorksheet = workbook.addWorksheet(CARE_ACTIVITY_SHEET_NAME, {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    const headerColumns: HeaderColumns[] = Object.keys(activities[0]).map((header, index) => ({
      header: header,
      key: header,
      width: index === 0 ? 6 : index === 3 ? 50 : 13,
    }));

    // Determine the maximum row and column count
    const maxRow = 10000;
    const maxCol = headerColumns.length;
    const excelMaxRows = 1048576;

    // Add header
    gapMatrixWorksheet.columns = headerColumns;

    // Add rows
    gapMatrixWorksheet.insertRows(2, activities, 'i');

    // add conditional formatting rules
    gapMatrixWorksheet.addConditionalFormatting({
      ref: `${getExcelColumnName(6)}2:${getExcelColumnName(maxCol)}${maxRow}`,
      rules: conditionalFormattingRules,
    });

    // subsequent rows - empty
    gapMatrixWorksheet.addConditionalFormatting({
      ref: `A${maxRow + 1}:XFD${excelMaxRows}`,
      rules: emptyGrayConditionalFormattingRules,
    });

    // subsequent columns - empty
    gapMatrixWorksheet.addConditionalFormatting({
      ref: `${getExcelColumnName(maxCol + 1)}2:XFD${excelMaxRows}`,
      rules: emptyGrayConditionalFormattingRules,
    });

    /** Enable sheet protection */

    // Set the locked property of all cells to false (unprotected)
    for (let rowNumber = 1; rowNumber <= maxRow; rowNumber++) {
      for (let colNumber = 1; colNumber <= maxCol; colNumber++) {
        const cell = gapMatrixWorksheet.getRow(rowNumber).getCell(colNumber);

        let locked = false;

        // if colNumber = 1 (id column) then keep the column locked and hidden
        if (colNumber === 1) {
          locked = true;
          cell.style = headerStyle;
        }

        // if rowNumber = 1 (header row) then keep the row locked and hidden
        if (rowNumber === 1) {
          locked = true;
          cell.style = headerStyle;
          cell.alignment = { wrapText: false };
        } else {
          // care activity type data validation
          if (colNumber === 5) {
            cell.dataValidation = {
              type: 'list',
              allowBlank: false,
              showDropDown: true,
              formulae: [`"${Object.values(CareActivityType).join(',')}"`],
              showErrorMessage: true,
              errorStyle: 'error',
              errorTitle: 'Invalid value',
              error: `Please enter ${Object.values(CareActivityType)
                .map(_ => `"${_}"`)
                .join(' or ')} only.`,
            };
          }

          // if colNumber >= 6 then enable data validation to only allow values - Y / N / LC
          if (colNumber >= 6) {
            cell.dataValidation = {
              type: 'list',
              allowBlank: false,
              showDropDown: true,
              formulae: [`"${BULK_UPLOAD_ALLOWED_PERMISSIONS.join(',')}"`],
              showErrorMessage: true,
              errorStyle: 'error',
              errorTitle: 'Invalid value',
              error: `Please enter ${BULK_UPLOAD_ALLOWED_PERMISSIONS.map(_ => `"${_}"`).join(
                ' or ',
              )} only. Refer Legend sheet for more information`,
            };
          }

          cell.protection = { locked };
        }
      }
    }

    // add legend worksheet
    addLegendWorksheet(workbook);

    // return the entire workbook as xlsx
    return workbook.xlsx;
  }, []);

  const onDownloadClick = useCallback(async () => {
    const config = { endpoint: API_ENDPOINT.CARE_ACTIVITY_DOWNLOAD };

    fetchData(
      config,
      async (occupations: Record<string, string>[]) => {
        const xlsx = await createSheets(occupations);

        await triggerExcelDownload(xlsx, `care-activities-${dayjs().format('YYYY-MM-DD')}`);
      },
      'Failed to download current data',
      () => {},
    );
  }, [createSheets, fetchData]);

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const careActivitiesData: CareActivityBulkData[] = [];

      try {
        await workbook.xlsx.load(buffer);
      } catch {
        throw new Error('Failed to load workbook');
      }

      let isCareActivitySheetAvailable = false;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      workbook.eachSheet((worksheet: any) => {
        // do not need to read other worksheets
        if (worksheet.name !== CARE_ACTIVITY_SHEET_NAME) {
          return;
        }

        // care activity sheet is available
        isCareActivitySheetAvailable = true;

        // Iterate over all rows that have values in a worksheet
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        worksheet.eachRow({ includeEmpty: false }, (row: any, rowNumber: number) => {
          // header row
          if (rowNumber === 1) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            row.eachCell({ includeEmpty: false }, (cell: any) => {
              careActivitiesHeaders.push(cell.value);
            });
            return;
          }

          // care activity rows
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const careActivityRowData: any = {};

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      if (!UploadSheetColumns.every(c => (careActivitiesHeaders || []).includes(c.header))) {
        throw new Error(
          'Some of the headers are missing. The excel is possibly renamed / tampered',
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
          <li>
            To edit, keep <b>ID</b> column as it is and edit other columns.
          </li>
          <li>
            To delete, use <b>Delete</b> button on Care Activity table.
          </li>
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
              Download current data .xlsx
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
