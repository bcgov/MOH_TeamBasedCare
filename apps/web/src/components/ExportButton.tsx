import { useHttp } from '@services';
import { API_ENDPOINT } from 'src/common';
const fileDownload = require('js-file-download');
import { Button } from './Button';

interface ExportButtonProps {
  sessionId: any;
}

export const ExportButton = ({ sessionId }: ExportButtonProps) => {
  const { sendApiRequest } = useHttp();

  const exportToCsv = () => {
    const config = { endpoint: API_ENDPOINT.getExportCsv(sessionId), method: 'POST' };

    sendApiRequest(config, (data: any) => {
      fileDownload(data, 'activity_gap_summary.csv');
    });
  };
  return (
    <Button variant='primary' type='button' classes={`ml-2`} onClick={exportToCsv}>
      Export
    </Button>
  );
};
