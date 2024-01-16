import { useHttp } from '@services';
import { API_ENDPOINT } from 'src/common';
import { Button } from './Button';
import { FileDownload } from 'src/utils/file-download.util';
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
    return { header: title, key: title, width: 10 };
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

      return [{ ...emptyRow, name: remainder.name }, ...careActivities, emptyRow];
    })
    .flat();

  /** create new workbook */
  const workbook = new ExcelJS.Workbook();

  // header style
  const headerStyle = {
    fill: { type: 'pattern', pattern: 'lightGray' },
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
    views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }],
  });

  // header row style
  gapMatrixWorksheet.getRow(1).style = headerStyle;

  // Add header
  gapMatrixWorksheet.columns = columns;

  // Add array rows
  gapMatrixWorksheet.addRows(resultData);

  // add conditional formatting rules
  gapMatrixWorksheet.addConditionalFormatting({
    ref: 'B3:XFD10000',
    rules: conditionalFormattingRules,
  });

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
      style: {
        ...headerStyle,
        font: { bold: true },
      },
    },
    {
      header: '',
      key: 'value',
      width: 25,
      style: {
        ...headerStyle,
        font: { bold: true },
      },
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
