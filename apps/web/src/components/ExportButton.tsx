import { useHttp } from '@services';
import { API_ENDPOINT, REQUEST_METHOD } from 'src/common';
const fileDownload = require('js-file-download');
import { Button } from './Button';
import { ResponseType } from 'axios';

interface ExportButtonProps {
  sessionId: any;
}

export const ExportButton = ({ sessionId }: ExportButtonProps) => {
  const { sendApiRequest } = useHttp();

  const exportToXlsx = () => {
    const config = {
      endpoint: API_ENDPOINT.getExportXlsx(sessionId),
      method: REQUEST_METHOD.POST,
      responseType: 'blob' as ResponseType,
    };

    sendApiRequest(config, (data: any) => {
      fileDownload(data, 'activity_gap_summary.xlsx');
    });
  };
  return (
    <Button variant='primary' type='button' classes={`ml-2`} onClick={exportToXlsx}>
      Export
    </Button>
  );
};
