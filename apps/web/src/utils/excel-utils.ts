import { FileDownload } from './file-download.util';

const ExcelJS = require('exceljs');

export interface HeaderColumns {
  header: string;
  key: string;
  width?: number;
}

export const createNewWorkbook = () => {
  return new ExcelJS.Workbook();
};

export const headerStyle = {
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
export const textAndFills = [
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
export const conditionalFormattingRules = textAndFills.map(({ text, fill }) => ({
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

export const emptyGrayConditionalFormattingRules = [
  {
    priority: 1,
    type: 'cellIs',
    operator: 'equal',
    formulae: [`""`],
    style: {
      fill: headerStyle.fill,
      alignment: {
        vertical: 'middle',
        horizontal: 'center',
      },
    },
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const addLegendWorksheet = (workbook: any) => {
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
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const triggerExcelDownload = async (xlsx: any, title: string) => {
  FileDownload.download(
    await xlsx.writeBuffer(),
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    `${title}.xlsx`,
  );
};

export const getExcelColumnName = (colNumber: number) => {
  let dividend = colNumber;
  let columnName = '';
  let modulo;

  while (dividend > 0) {
    modulo = (dividend - 1) % 26;
    columnName = String.fromCharCode(65 + modulo) + columnName;
    dividend = Math.floor((dividend - modulo) / 26);
  }

  return columnName;
};
