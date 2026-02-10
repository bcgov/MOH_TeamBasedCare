import { SuggestionResponseRO } from '@tbcm/common';
import { useCallback } from 'react';
import { API_ENDPOINT, REQUEST_METHOD } from 'src/common';
import { useHttp } from './useHttp';

export interface GetSuggestionsParams {
  sessionId: string;
  tempSelectedIds?: string[];
  page?: number;
  pageSize?: number;
}

export const useSuggestions = () => {
  const { sendApiRequest, isLoading } = useHttp();

  const getSuggestions = useCallback(
    (
      params: GetSuggestionsParams,
      successCallback: (data: SuggestionResponseRO) => void,
      errorCallback?: () => void,
    ) => {
      const config = {
        endpoint: API_ENDPOINT.getSuggestions(params.sessionId),
        method: REQUEST_METHOD.POST,
        data: {
          tempSelectedIds: params.tempSelectedIds || [],
          page: params.page || 1,
          pageSize: params.pageSize || 10,
        },
      };

      sendApiRequest(config, successCallback, errorCallback);
    },
    [sendApiRequest],
  );

  return {
    getSuggestions,
    isLoading,
  };
};
