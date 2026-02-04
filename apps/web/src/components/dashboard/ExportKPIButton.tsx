import { Button } from '../Button';
import { KPIsOverviewRO } from '@tbcm/common';
import ExcelJS from 'exceljs';
import { FileDownload } from 'src/utils/file-download.util';

export interface ExportKPIButtonProps {
  data: KPIsOverviewRO | null;
  isLoading: boolean;
}

export const ExportKPIButton: React.FC<ExportKPIButtonProps> = ({ data, isLoading }) => {
  const handleExport = async () => {
    if (!data) return;

    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date();

    // Sheet 1: General KPIs
    const generalSheet = workbook.addWorksheet('General_KPIs');
    generalSheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 15 },
    ];
    generalSheet.addRow({ metric: 'Total Users', value: data.general.totalUsers });
    generalSheet.addRow({ metric: 'Active Users (This Month)', value: data.general.activeUsers });
    generalSheet.addRow({ metric: 'Total Care Plans', value: data.general.totalCarePlans });
    generalSheet.addRow({ metric: 'Export Date', value: new Date().toLocaleDateString() });

    // Style header row
    generalSheet.getRow(1).font = { bold: true };
    generalSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Sheet 2: Care Plans by Setting
    const carePlansSheet = workbook.addWorksheet('Care_Plans_By_Settings');
    carePlansSheet.columns = [
      { header: 'Care Setting', key: 'careSetting', width: 40 },
      { header: 'Health Authority', key: 'healthAuthority', width: 35 },
      { header: 'Care Plan Count', key: 'count', width: 18 },
    ];

    data.carePlansBySetting.forEach(item => {
      carePlansSheet.addRow({
        careSetting: item.careSettingName,
        healthAuthority: item.healthAuthority,
        count: item.count,
      });
    });

    // Style header row
    carePlansSheet.getRow(1).font = { bold: true };
    carePlansSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `KPI_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    FileDownload.download(
      buffer as Buffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileName,
    );
  };

  return (
    <Button
      variant='primary'
      onClick={handleExport}
      disabled={isLoading || !data}
      loading={isLoading}
    >
      Download Report
    </Button>
  );
};
