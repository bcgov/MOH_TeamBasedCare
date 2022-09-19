import { useEffect, useState } from 'react';
import { API_ENDPOINT } from '../common';
import { useHttp } from './useHttp';
import { REQUEST_METHOD } from '../common';

export const usePlanningSession = () => {
  const { sendApiRequest, isLoading } = useHttp();
  const [sessionId, setSessionId] = useState<string>();

  useEffect(() => {
    const config = { endpoint: API_ENDPOINT.SESSIONS, method: REQUEST_METHOD.POST };

    sendApiRequest(config, (data: any) => {
      setSessionId(data.id);
    });
  }, []);

  return { sessionId, isLoading };
};
