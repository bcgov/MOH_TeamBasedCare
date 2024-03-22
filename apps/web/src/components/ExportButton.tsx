import { useHttp } from '@services';
import { API_ENDPOINT } from 'src/common';
import { Button } from './Button';
import { FileDownload } from 'src/utils/file-download.util';
import { formatDateTime } from '@tbcm/common';
import { AppStorage, StorageKeys } from 'src/utils/storage';
const ExcelJS = require('exceljs');

interface ExportButtonProps {
  sessionId: any;
}

export const ExportButton = ({ sessionId }: ExportButtonProps) => {
  const { fetchData } = useHttp();

  const exportToXlsx = () => {
    const config = {
      endpoint: API_ENDPOINT.getPlanningActivityGap(sessionId),
    };

    fetchData(config, async (data: any) => {
      const xlsx = convertActivityGapTableToXLSX(data);

      FileDownload.download(
        await xlsx.writeBuffer(),
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'activity_gap_summary.xlsx',
      );
    });
  };
  return (
    <Button variant='primary' type='button' classes={`ml-2`} onClick={exportToXlsx}>
      Export
    </Button>
  );
};

const convertActivityGapTableToXLSX = (data: any) => {
  const columns = data.headers.map(({ title }: { title: string }) => {
    if (title === 'Activities Bundle')
      return { header: 'Activities Bundle', key: 'name', width: 50 };
    return { header: title, key: title, width: 13 };
  });

  const emptyRow = {
    ...data.headers.reduce((acc: any, curr: any) => ((acc[curr] = ''), acc), {}),
    name: '',
  };

  const resultData = data.data
    .map((element: any) => {
      const { careActivities, ...remainder } = element;

      // add N to empty values [not in Permissions]
      careActivities?.forEach((activity: any) => {
        Object.keys(activity).map((key: string) => {
          if (activity[key] === '') activity[key] = 'N';
        });
      });

      return [
        { ...emptyRow, name: remainder.name, isBundleHeader: true },
        ...careActivities,
        emptyRow,
      ];
    })
    .flat();

  /** create new workbook */
  const workbook = new ExcelJS.Workbook();

  // header style
  const headerStyle = {
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D3D3D3' },
    },
    font: { bold: true },
    alignment: {
      wrapText: true,
      vertical: 'middle',
      horizontal: 'center',
    },
  };

  // text and fills configuration
  const textAndFills = [
    {
      text: 'N',
      fill: { bgColor: 'FFC7CE', fgColor: '9C0006' },
    },
    {
      text: 'Outside scope of practice',
      fill: { bgColor: 'FFC7CE', fgColor: '9C0006' },
    },
    {
      text: 'Y',
      fill: { bgColor: 'C6EFCE', fgColor: '9C0006' },
    },
    {
      text: 'Within scope of practice',
      fill: { bgColor: 'C6EFCE', fgColor: '9C0006' },
    },
    {
      text: 'LC',
      fill: { bgColor: 'FFEB9C', fgColor: '9C6500' },
    },
    {
      text: 'With limits and conditions',
      fill: { bgColor: 'FFEB9C', fgColor: '9C6500' },
    },
  ];

  // conditional formatting rules
  const conditionalFormattingRules = textAndFills.map(({ text, fill }) => ({
    priority: 1,
    type: 'cellIs',
    operator: 'equal',
    formulae: [`"${text}"`],
    style: {
      fill: {
        type: 'pattern',
        pattern: 'solid',
        bgColor: { argb: fill.bgColor },
        fgColor: { argb: fill.fgColor },
      },
      alignment: {
        vertical: 'middle',
        horizontal: 'center',
      },
    },
  }));

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
  resultData.forEach((rowData: any) => {
    const row = gapMatrixWorksheet.addRow(rowData);
    if (rowData.isBundleHeader) {
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
  const legendWorksheet = workbook.addWorksheet('Legend');

  // add legend columns
  legendWorksheet.columns = [
    {
      header: 'Legend',
      key: 'legend',
      width: 10,
      style: headerStyle,
    },
    {
      header: '',
      key: 'value',
      width: 25,
      style: headerStyle,
    },
  ];

  // add legend rows
  legendWorksheet.addRow(); // empty row
  legendWorksheet.addRow({ legend: 'Y', value: 'Within scope of practice' });
  legendWorksheet.addRow({ legend: 'LC', value: 'With limits and conditions' });
  legendWorksheet.addRow({ legend: 'N', value: 'Outside scope of practice' });

  // style the sheet
  legendWorksheet.mergeCells('A1:B1');

  // add conditional formatting
  legendWorksheet.addConditionalFormatting({
    ref: 'A:B',
    rules: conditionalFormattingRules,
  });

  // return the entire workbook as xlsx
  return workbook.xlsx;
};
