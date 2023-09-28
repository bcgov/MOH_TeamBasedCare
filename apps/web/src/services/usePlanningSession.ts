import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { API_ENDPOINT } from '../common';
import { useHttp } from './useHttp';
import { REQUEST_METHOD } from '../common';
import { formatDateFromNow } from '@tbcm/common';

export const usePlanningSession = () => {
  const { sendApiRequest, isLoading, fetchData } = useHttp();
  const [sessionId, setSessionId] = useState<string>();
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    setMessage('Fetching existing planning session..');
    fetchData({ endpoint: API_ENDPOINT.DRAFT_SESSION }, (data: any) => {
      if (data?.id) {
        setSessionId(data.id);
        toast.info(`Fetched previously saved session from ${formatDateFromNow(data.updatedAt)}`);
        return;
      }

      // otherwise create a new one
      setMessage('Not found. Initiating a new one..');

      const config = { endpoint: API_ENDPOINT.SESSIONS, method: REQUEST_METHOD.POST };
      sendApiRequest(config, (data: any) => {
        setSessionId(data.id);
        setMessage(''); // reset
      });
    });
  }, []);

  return { sessionId, isLoading, message };
};
