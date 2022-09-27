import { useState, useEffect } from 'react';
import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { useHttp } from './useHttp';
import { usePlanningContext } from './usePlanningContext';

export const usePlanningActivitiesGap = () => {
  const {
    state: { sessionId },
    updateProceedToNext,
  } = usePlanningContext();
  const [initialValues, setInitialValues] = useState<any>({
    data: [],
  });
  const { sendApiRequest, fetchData } = useHttp();

  const handleSubmit = (values: any) => {
    sendApiRequest(
      {
        method: REQUEST_METHOD.PATCH,
        data: values,
        endpoint: API_ENDPOINT.getPlanningActivityGap(sessionId),
      },
      () => {
        updateProceedToNext();
      },
    );
  };

  useEffect(() => {
    if (sessionId) {
      fetchData({ endpoint: API_ENDPOINT.getPlanningActivityGap(sessionId) }, (data: any) => {
        if (data && Object.keys(data).length > 0) {
          setInitialValues(data);
        }
      });
    }
  }, [sessionId]);

  return { handleSubmit, initialValues };
};
