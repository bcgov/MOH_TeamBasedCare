import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { EditCareActivityCMSDTO } from '@tbcm/common';
import { toast } from 'react-toastify';
import { useState } from 'react';
import { AxiosPublic } from 'src/utils';

export const useCareActivityCMSEdit = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (
    id: string,
    values: EditCareActivityCMSDTO,
    onSuccess?: () => void,
    onError?: (errorMessage: string) => void,
  ) => {
    setIsLoading(true);
    try {
      await AxiosPublic(API_ENDPOINT.updateCareActivityCMS(id), {
        method: REQUEST_METHOD.PATCH,
        data: values,
      });
      toast.info('Care activity updated successfully.');
      onSuccess?.();
    } catch (err: any) {
      let errorMessage = 'Failed to update care activity.';
      const responseData = err?.response?.data;
      const apiErrorMessage = responseData?.errorMessage ?? responseData?.message;

      if (typeof apiErrorMessage === 'string') {
        errorMessage = apiErrorMessage;
      } else if (Array.isArray(apiErrorMessage)) {
        const validationErrors = apiErrorMessage
          .flat(3)
          .filter((item: any) => item?.errors)
          .flatMap((item: any) => item.errors)
          .join(', ');
        if (validationErrors) {
          errorMessage = validationErrors;
        }
      }

      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSubmit, isLoading };
};
