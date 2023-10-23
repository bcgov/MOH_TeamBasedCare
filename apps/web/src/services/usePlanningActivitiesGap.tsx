import { useState, useEffect } from 'react';
import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { useHttp } from './useHttp';
import { usePlanningContext } from './usePlanningContext';

export const usePlanningActivitiesGap = () => {
  const {
    state: { sessionId, refetchActivityGap },
    updateProceedToNext,
    updateRefetchActivityGap,
  } = usePlanningContext();
  const [initialValues, setInitialValues] = useState<any>({
    data: [],
  });
  const { sendApiRequest, fetchData, isLoading } = useHttp();

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
    if (sessionId || refetchActivityGap) {
      // after initiating trigger of updated date, mark it false;
      updateRefetchActivityGap(false);

      fetchData({ endpoint: API_ENDPOINT.getPlanningActivityGap(sessionId) }, (data: any) => {
        if (data && Object.keys(data).length > 0) {
          setInitialValues(data);
        }
      });
    }
  }, [sessionId, refetchActivityGap, fetchData]);

  return { handleSubmit, initialValues, isLoading };
};
