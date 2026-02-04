import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { EditOccupationCMSDTO } from '@tbcm/common';
import { toast } from 'react-toastify';
import { useState } from 'react';
import { AxiosPublic } from 'src/utils';

export const useOccupationCMSEdit = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (
    id: string,
    values: EditOccupationCMSDTO,
    onSuccess?: () => void,
    onError?: (errorMessage: string) => void,
  ) => {
    setIsLoading(true);
    try {
      await AxiosPublic(API_ENDPOINT.updateOccupationCMS(id), {
        method: REQUEST_METHOD.PATCH,
        data: values,
      });
      toast.info('Occupation updated successfully.');
      onSuccess?.();
    } catch (err: any) {
      // Parse validation errors from API response
      // ErrorExceptionFilter returns: {errorType, errorMessage, errorDetails}
      let errorMessage = 'Failed to update occupation.';
      const responseData = err?.response?.data;
      const apiErrorMessage = responseData?.errorMessage ?? responseData?.message;

      if (typeof apiErrorMessage === 'string') {
        // Simple string message
        errorMessage = apiErrorMessage;
      } else if (Array.isArray(apiErrorMessage)) {
        // NestJS validation pipe format: [[{property, errors}], ...]
        // Flatten nested arrays and extract error messages
        const validationErrors = apiErrorMessage
          .flat(3) // Flatten up to 3 levels deep
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
