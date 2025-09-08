import {
  BULK_UPLOAD_ALLOWED_PERMISSIONS,
  BULK_UPLOAD_COLUMNS,
  CareActivityType,
} from '@tbcm/common';
import { FileDownload } from './file-download.util';
import { CareActivitySheetName } from 'src/common';
import { OccupationItemProps } from 'src/common/interfaces';
import ExcelJS from 'exceljs';
import _ from 'lodash';

export interface HeaderColumns {
  header: string;
  key: string;
  width?: number;
}

export const createNewWorkbook = () => {
  return new ExcelJS.Workbook();
};

export const headerStyle: Partial<ExcelJS.Style> = {
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
export const conditionalFormattingRules: ExcelJS.ConditionalFormattingRule[] = textAndFills.map(
  ({ text, fill }) => ({
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
  }),
);

export const emptyGrayConditionalFormattingRules: ExcelJS.ConditionalFormattingRule[] = [
  {
    priority: 1,
    type: 'cellIs' as const,
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

export const setValidationFormat = (sheet: ExcelJS.Worksheet) => {
  // Determine the maximum row and column count
  const maxRow = 10000;
  const maxCol = sheet.columns.length;
  const excelMaxRows = 1048576;
  const excelMaxColumns = 16384;

  // add conditional formatting rules
  sheet.addConditionalFormatting({
    ref: `${getExcelColumnName(6)}2:${getExcelColumnName(maxCol)}${maxRow}`,
    rules: conditionalFormattingRules,
  });

  // subsequent rows - empty
  sheet.addConditionalFormatting({
    ref: `A${maxRow + 1}:XFD${excelMaxRows}`,
    rules: emptyGrayConditionalFormattingRules,
  });

  // subsequent columns - empty
  sheet.addConditionalFormatting({
    ref: `${getExcelColumnName(excelMaxColumns)}2:XFD${excelMaxRows}`,
    rules: emptyGrayConditionalFormattingRules,
  });

  /** Enable sheet protection */

  // Set the locked property of all cells to false (unprotected)
  for (let rowNumber = 1; rowNumber <= maxRow; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    for (let colNumber = 1; colNumber <= maxCol; colNumber++) {
      const cell = row.getCell(colNumber);

      let locked = false;

      // if colNumber = 1 (id column) then keep the column locked and hidden
      if (colNumber === 1) {
        locked = true;
        cell.style = { ...headerStyle };
        cell.alignment = { wrapText: false };
      }

      // if rowNumber = 1 (header row) then keep the row locked and hidden
      if (rowNumber === 1) {
        locked = true;
        cell.style = { ...headerStyle };
      } else {
        // care activity type data validation
        if (colNumber === 5) {
          cell.dataValidation = {
            type: 'list',
            allowBlank: false,
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
            formulae: [`"${BULK_UPLOAD_ALLOWED_PERMISSIONS.join(',')}"`],
            showErrorMessage: true,
            errorStyle: 'error',
            errorTitle: 'Invalid value',
            error: `Please enter ${BULK_UPLOAD_ALLOWED_PERMISSIONS.map(_ => `"${_}"`).join(
              ' or ',
            )} only. Refer Legend sheet for more information`,
          };
        }
      }
      cell.protection = { locked };
    }
  }
};

export const headerColumns: HeaderColumns[] = [
  { header: BULK_UPLOAD_COLUMNS.ID, key: 'id', width: 6 },
  { header: BULK_UPLOAD_COLUMNS.CARE_SETTING, key: 'care_setting', width: 13 },
  { header: BULK_UPLOAD_COLUMNS.CARE_BUNDLE, key: 'care_activity_bundle', width: 13 },
  { header: BULK_UPLOAD_COLUMNS.CARE_ACTIVITY, key: 'care_activity', width: 50 },
  { header: BULK_UPLOAD_COLUMNS.ASPECT_OF_PRACTICE, key: 'aspect_of_practice', width: 13 },
];

export const createDownloadTemplate = async (occupations: OccupationItemProps[]) => {
  const workbook = createNewWorkbook();

  const activitySheet = workbook.addWorksheet(CareActivitySheetName, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  // construct column headers
  const columns = [...headerColumns];
  _.sortBy(occupations, 'name').forEach(occupation => {
    columns.push({
      header: occupation.displayName,
      key: occupation.displayName,
      width: 13,
    });
  });
  activitySheet.columns = columns;

  setValidationFormat(activitySheet);

  addLegendWorksheet(workbook);

  return workbook.xlsx;
};

export const createDownloadSheets = async (activities: Record<string, string>[]) => {
  const workbook = createNewWorkbook();

  const activitySheet = workbook.addWorksheet(CareActivitySheetName, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const columns: HeaderColumns[] = Object.keys(activities[0]).map((header, index) => ({
    header: header,
    key: header,
    width: index === 0 ? 6 : index === 3 ? 50 : 13,
  }));

  activitySheet.columns = columns;

  activitySheet.insertRows(2, activities, 'i');

  setValidationFormat(activitySheet);

  addLegendWorksheet(workbook);

  return workbook.xlsx;
};
