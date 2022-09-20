import { useState, useEffect } from 'react';
import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { useHttp } from './useHttp';
import { usePlanningContext } from './usePlanningContext';

export const usePlanningCareActivities = () => {
  const {
    state: { sessionId },
    updateProceedToNext,
  } = usePlanningContext();
  const [initialValues, setInitialValues] = useState<any>({
    careActivities: [],
    careActivityBundle: [],
  });
  const { sendApiRequest, fetchData } = useHttp();

  const handleSubmit = (values: any) => {
    sendApiRequest(
      {
        method: REQUEST_METHOD.POST,
        data: values,
        endpoint: API_ENDPOINT.getPlanningProfile(sessionId),
      },
      () => {
        updateProceedToNext();
      },
    );
  };

  useEffect(() => {
    if (sessionId) {
      fetchData({ endpoint: API_ENDPOINT.getPlanningProfile(sessionId) }, (data: any) => {
        if (data) {
          setInitialValues(data);
        }
      });
    }
  }, [sessionId]);

  return { handleSubmit, initialValues };
};
