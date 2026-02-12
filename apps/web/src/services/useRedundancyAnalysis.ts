import { RedundancyAnalysisResponseRO } from '@tbcm/common';
import { useCallback } from 'react';
import { API_ENDPOINT, REQUEST_METHOD } from 'src/common';
import { useHttp } from './useHttp';

export const useRedundancyAnalysis = () => {
  const { sendApiRequest, isLoading } = useHttp();

  const getRedundantOccupations = useCallback(
    (
      sessionId: string,
      successCallback: (data: RedundancyAnalysisResponseRO) => void,
      errorCallback?: () => void,
    ) => {
      const config = {
        endpoint: API_ENDPOINT.getRedundantOccupations(sessionId),
        method: REQUEST_METHOD.POST,
        data: {},
      };

      sendApiRequest(config, successCallback, errorCallback);
    },
    [sendApiRequest],
  );

  return {
    getRedundantOccupations,
    isLoading,
  };
};
