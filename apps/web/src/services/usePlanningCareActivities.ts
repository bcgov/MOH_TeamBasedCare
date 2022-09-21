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
    careActivityBundle: {},
    careActivityID: '',
  });
  const { sendApiRequest, fetchData } = useHttp();

  const handleSubmit = (values: any) => {
    sendApiRequest(
      {
        method: REQUEST_METHOD.PATCH,
        data: values,
        endpoint: API_ENDPOINT.getPlanningCareActivity(sessionId),
      },
      () => {
        updateProceedToNext();
      },
    );
  };

  useEffect(() => {
    if (sessionId) {
      fetchData({ endpoint: API_ENDPOINT.getPlanningCareActivity(sessionId) }, (data: any) => {
        if (data && Object.keys(data).length > 0) {
          setInitialValues({
            careActivities: [],
            careActivityBundle: data,
            careActivityID: '',
          });
        }
      });
    }
  }, [sessionId]);

  return { handleSubmit, initialValues };
};
