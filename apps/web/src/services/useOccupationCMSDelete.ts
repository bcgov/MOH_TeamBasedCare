import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { useHttp } from './useHttp';
import { OccupationCMSRO } from '@tbcm/common';
import { toast } from 'react-toastify';

export const useOccupationCMSDelete = () => {
  const { sendApiRequest, isLoading } = useHttp();

  const handleSubmit = (occupation: OccupationCMSRO, cb?: () => void) => {
    const config = {
      endpoint: API_ENDPOINT.deleteOccupation(occupation.id),
      method: REQUEST_METHOD.DELETE,
    };

    sendApiRequest(
      config,
      () => {
        cb?.();
        toast.info('Occupation deleted successfully.');
      },
      () => void 0,
      'Failed to delete occupation.',
    );
  };

  return { handleSubmit, isLoading };
};
