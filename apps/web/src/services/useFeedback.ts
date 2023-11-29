import { CreateFeedbackDto } from '@tbcm/common';
import { useCallback } from 'react';
import { API_ENDPOINT, REQUEST_METHOD } from 'src/common';
import { useHttp } from './useHttp';

export const useFeedback = () => {
  const { sendApiRequest, isLoading } = useHttp();

  const createFeedback = useCallback(
    (feedback: CreateFeedbackDto, successCallback: () => void) => {
      const config = {
        endpoint: API_ENDPOINT.FEEDBACK,
        method: REQUEST_METHOD.POST,
        data: feedback,
      };

      sendApiRequest(config, successCallback);
    },
    [sendApiRequest],
  );

  return {
    createFeedback,
    isLoading,
  };
};
