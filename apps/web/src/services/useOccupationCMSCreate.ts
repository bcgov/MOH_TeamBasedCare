/**
 * Occupation CMS Create Hook
 *
 * Provides functionality to create a new occupation via the CMS API.
 * Handles API submission with success/error toast notifications.
 *
 * @returns Object with handleSubmit function and loading state
 *
 * @example
 * const { handleSubmit, isLoading } = useOccupationCMSCreate();
 *
 * handleSubmit(values, (newId) => {
 *   router.push(`/content-management/occupation/${newId}`);
 * }, (errorMessage) => {
 *   // Handle field-level error
 * });
 */

import { CreateOccupationDTO } from '@tbcm/common';
import { useState } from 'react';
import { API_ENDPOINT, REQUEST_METHOD } from 'src/common';
import { toast } from 'react-toastify';
import { AxiosPublic } from 'src/utils';

export const useOccupationCMSCreate = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (
    values: CreateOccupationDTO,
    onSuccess?: (id: string) => void,
    onError?: (errorMessage: string) => void,
  ) => {
    setIsLoading(true);
    try {
      const { data } = await AxiosPublic(API_ENDPOINT.createOccupation, {
        method: REQUEST_METHOD.POST,
        data: values,
      });
      toast.info('Occupation created successfully.');
      onSuccess?.(data.id);
    } catch (err: any) {
      // Parse validation errors from API response
      // ErrorExceptionFilter returns: {errorType, errorMessage, errorDetails}
      let errorMessage = 'Failed to create occupation.';
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
