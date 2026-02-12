import { MinimumTeamResponseRO } from '@tbcm/common';
import { useCallback } from 'react';
import { API_ENDPOINT, REQUEST_METHOD } from 'src/common';
import { useHttp } from './useHttp';

export const useMinimumTeam = () => {
  const { sendApiRequest, isLoading } = useHttp();

  const getMinimumTeam = useCallback(
    (
      sessionId: string,
      successCallback: (data: MinimumTeamResponseRO) => void,
      errorCallback?: () => void,
    ) => {
      const config = {
        endpoint: API_ENDPOINT.getMinimumTeam(sessionId),
        method: REQUEST_METHOD.POST,
        data: {},
      };

      sendApiRequest(config, successCallback, errorCallback);
    },
    [sendApiRequest],
  );

  return {
    getMinimumTeam,
    isLoading,
  };
};
