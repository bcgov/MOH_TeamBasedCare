import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { useHttp } from './useHttp';
import { EditCareActivityDTO } from '@tbcm/common';
import { toast } from 'react-toastify';

export const useCareActivityEdit = () => {
  const { sendApiRequest, isLoading } = useHttp();

  const handleSubmit = async (id: string, values: EditCareActivityDTO, cb?: () => void) => {
    const config = {
      endpoint: `${API_ENDPOINT.CARE_ACTIVITY}/${id}`,
      method: REQUEST_METHOD.PATCH,
      data: values,
    };

    await sendApiRequest(
      config,
      () => {
        cb?.();
        toast.info(`Care activity updated successful.`);
      },
      () => void 0,
      'Care activity failed to be updated.',
    );
  };

  return { handleSubmit, isLoading };
};
