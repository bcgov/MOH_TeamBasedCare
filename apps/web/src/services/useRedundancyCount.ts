import { useCallback, useEffect, useState } from 'react';
import { RedundancyAnalysisResponseRO } from '@tbcm/common';
import { usePlanningContext } from './usePlanningContext';
import { useHttp } from './useHttp';
import { API_ENDPOINT, REQUEST_METHOD } from '../common/request-method';

export const useRedundancyCount = () => {
  const {
    state: { sessionId, refetchActivityGap },
  } = usePlanningContext();
  const { sendApiRequest, isLoading } = useHttp();
  const [removableCount, setRemovableCount] = useState<number | null>(null);

  const fetchCount = useCallback(() => {
    if (!sessionId) return;
    sendApiRequest(
      {
        endpoint: API_ENDPOINT.getRedundantOccupations(sessionId),
        method: REQUEST_METHOD.POST,
        data: {},
      },
      (data: RedundancyAnalysisResponseRO) => {
        setRemovableCount(data.removableOccupations.length);
      },
    );
  }, [sessionId, sendApiRequest]);

  useEffect(() => {
    if (sessionId) {
      fetchCount();
    }
  }, [sessionId, refetchActivityGap, fetchCount]);

  return { removableCount, isLoading };
};
