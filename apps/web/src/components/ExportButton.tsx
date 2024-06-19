import { useHttp } from '@services';
import { API_ENDPOINT } from 'src/common';
import { Button } from './Button';
import {
  ActivityGap,
  ActivityGapCareActivity,
  ActivityGapData,
  ActivityGapHeader,
  formatDateTime,
} from '@tbcm/common';
import { AppStorage, StorageKeys } from 'src/utils/storage';
import {
  addLegendWorksheet,
  conditionalFormattingRules,
  createNewWorkbook,
  headerStyle,
  triggerExcelDownload,
} from 'src/utils/excel-utils';

interface ExportButtonProps {
  sessionId: string;
  disabled: boolean;
}

export const ExportButton = ({ sessionId, disabled }: ExportButtonProps) => {
  const { fetchData } = useHttp();

  const exportToXlsx = () => {
    const config = {
      endpoint: API_ENDPOINT.getPlanningActivityGap(sessionId),
    };

    fetchData(config, async (data: ActivityGap) => {
      const xlsx = convertActivityGapTableToXLSX(data);

      triggerExcelDownload(xlsx, 'activity_gap_summary');
    });
  };
  return (
    <Button
      disabled={disabled}
      variant='primary'
      type='button'
      classes={`ml-2`}
      onClick={exportToXlsx}
    >
      Export
    </Button>
  );
};

const convertActivityGapTableToXLSX = (data: ActivityGap) => {
  const columns = data.headers.map(({ title }: { title: string }) => {
    if (title === 'Activities Bundle')
      return { header: 'Activities Bundle', key: 'name', width: 50 };
    return { header: title, key: title, width: 13 };
  });

  const emptyRow: ActivityGapCareActivity = {
    ...data.headers.reduce(
      (acc: { [key: string]: string }, curr: ActivityGapHeader) => ((acc[curr.title] = ''), acc),
      {},
    ),
    name: '',
  };

  const resultData = data.data
    .map((element: ActivityGapData) => {
      const { careActivities, ...remainder } = element;

      // add N to empty values [not in Permissions]
      (careActivities as ActivityGapCareActivity[])?.forEach(activity => {
        Object.keys(activity).map((key: string) => {
          if (activity[key] === '') activity[key] = 'N';
        });
      });

      return [
        { ...emptyRow, name: remainder.name as string, isBundleHeader: true },
        ...(careActivities as ActivityGapCareActivity[]),
        emptyRow,
      ];
    })
    .flat();

  /** create new workbook */
  const workbook = createNewWorkbook();

  /**
   * Gap Matrix worksheet
   */
  const gapMatrixWorksheet = workbook.addWorksheet('Gap_Matrix', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 4 }],
  });

  // header row style
  gapMatrixWorksheet.getRow(1).style = headerStyle;

  // Add header
  gapMatrixWorksheet.columns = columns;

  // Add array rows
  resultData.forEach(rowData => {
    const row = gapMatrixWorksheet.addRow(rowData);
    if (rowData.isBundleHeader) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      row.eachCell((cell: any) => {
        cell.style = { font: { bold: true } };
      });
    }
  });

  // add conditional formatting rules
  gapMatrixWorksheet.addConditionalFormatting({
    ref: 'B5:XFD10000',
    rules: conditionalFormattingRules,
  });

  // Splice and add Informational headers at top
  const careSetting = data.careSetting || '';
  const createdAt = formatDateTime(new Date());
  const createdBy = AppStorage.getItem(StorageKeys.DISPLAY_NAME);

  const informationalRows = [
    [`Care Setting: ${careSetting}`],
    [`Created: ${createdAt} by ${createdBy}`],
    [
      'Please note that the data (Care Activities and Occupations) contained in this spreadsheet is accurate at the time it was generated. Data is subject to change periodically to align with current practice.',
    ],
    [],
  ];

  gapMatrixWorksheet.spliceRows(1, 0, ...informationalRows);

  // Care setting
  gapMatrixWorksheet.getCell('A1').style = {
    font: { bold: true },
    alignment: {
      wrapText: true,
      vertical: 'middle',
    },
  };

  // created By
  gapMatrixWorksheet.getCell('A2').style = {
    alignment: {
      wrapText: true,
      vertical: 'middle',
    },
  };

  // placeholder for updated by

  // text
  gapMatrixWorksheet.getCell('A3').style = { ...headerStyle, font: { bold: false } };
  gapMatrixWorksheet.getRow(3).height = 25;
  gapMatrixWorksheet.mergeCells(3, 1, 3, Math.max(columns.length, 13));

  /**
   * Legends Sheet
   */
  addLegendWorksheet(workbook);

  // return the entire workbook as xlsx
  return workbook.xlsx;
};
