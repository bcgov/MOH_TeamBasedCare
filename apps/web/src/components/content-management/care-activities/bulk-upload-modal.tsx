import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useHttp } from '@services';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { API_ENDPOINT } from 'src/common';
import { OccupationItemProps } from 'src/common/interfaces';
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

interface BulkUploadModalCMSProps {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
}

export const BulkUploadModalCMS: React.FC<BulkUploadModalCMSProps> = ({
  showModal,
  setShowModal,
}) => {
  const { fetchData } = useHttp();
  const [isDownloading, setIsDownloading] = useState(false);

  const createUploadTemplate = useCallback(async (occupations: OccupationItemProps[]) => {
    const workbook = createNewWorkbook();

    // add upload worksheet
    const gapMatrixWorksheet = workbook.addWorksheet('Upload_Gap_Matrix', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    const columns: HeaderColumns[] = [
      { header: 'ID (Read only)', key: 'id', width: 6 },
      { header: 'Care setting', key: 'care_setting', width: 13 },
      { header: 'Care activity bundle', key: 'care_activity_bundle', width: 13 },
      { header: 'Care activity', key: 'care_activity', width: 50 },
      { header: 'Aspect of practice', key: 'aspect_of_practice', width: 13 },
    ];

    occupations.forEach(occupation => {
      columns.push({
        header: occupation.displayName,
        key: occupation.displayName,
        width: 13,
      });
    });

    // Determine the maximum row and column count
    const maxRow = 10000;
    const maxCol = columns.length;
    const excelMaxRows = 1048576;

    // Add header
    gapMatrixWorksheet.columns = columns;

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
        }

        cell.protection = { locked };
      }
    }

    await gapMatrixWorksheet.protect('gap-matrix-worksheet', {
      formatColumns: true, // Allows the user to change column width and hide/unhide columns
    });

    // add legend worksheet
    addLegendWorksheet(workbook);

    // return the entire workbook as xlsx
    return workbook.xlsx;
  }, []);

  const onDownloadTemplateClick = useCallback(async () => {
    setIsDownloading(true);

    const config = { endpoint: API_ENDPOINT.OCCUPATIONS };

    fetchData(
      config,
      async (occupations: OccupationItemProps[]) => {
        const xlsx = await createUploadTemplate(occupations);

        await triggerExcelDownload(xlsx, 'upload-care-activity');

        setIsDownloading(false);
      },
      'Failed to download template',
      () => {
        setIsDownloading(false);
      },
    );
  }, [createUploadTemplate, fetchData]);

  const handleErrorBeforeSelection = useCallback((selectedFile: File) => {
    if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      throw new Error(
        'The file format is incorrect and cannot be uploaded to the system, please make changes to the file before re-uploading it to the dropzone above.',
      );
    }
  }, []);

  const handleFileUpload = useCallback(() => {}, []);

  return (
    <ModalWrapper
      isOpen={showModal}
      setIsOpen={setShowModal}
      title='Bulk upload'
      closeButton={{ title: 'Back' }}
      actionButton={{ title: 'Upload', isDisabled: true }}
    >
      <div className='p-4'>
        <div>
          Download and utilize the content configuration template for updates. Once you finish
          updating, upload the file to sync content to the database.
        </div>

        <div className='mt-4'>
          <Button
            loading={isDownloading}
            showChildrenOnLoading
            variant='link'
            disabled={isDownloading}
            classes='w-full bg-bcLightGray text-bcBlueLink'
            onClick={() => onDownloadTemplateClick()}
          >
            <div className='flex flex-row p-4'>
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
          />
        </div>
      </div>
    </ModalWrapper>
  );
};
