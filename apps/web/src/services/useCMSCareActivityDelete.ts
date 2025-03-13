import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { useHttp } from './useHttp';
import { CareActivityCMSRO } from '@tbcm/common';
import { toast } from 'react-toastify';

export const useCMSCareActivityDelete = () => {
  const { sendApiRequest, isLoading } = useHttp();

  const handleSubmit = (careActivity: CareActivityCMSRO, cb?: () => void) => {
    const config = {
      endpoint: `${API_ENDPOINT.CARE_ACTIVITY}/${careActivity.id}/${careActivity.unitName}`,
      method: REQUEST_METHOD.DELETE,
    };

    sendApiRequest(
      config,
      () => {
        cb?.();
        toast.info(`Care activity delete successful`);
      },
      () => void 0,
      'Care activity delete failed',
    );
  };

  return { handleSubmit, isLoading };
};
