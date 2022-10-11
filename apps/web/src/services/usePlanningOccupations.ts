import { useState, useEffect } from 'react';
import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { useHttp } from './useHttp';
import { usePlanningContext } from './usePlanningContext';

export const usePlanningOccupations = () => {
  const {
    state: { sessionId },
    updateProceedToNext,
  } = usePlanningContext();
  const [initialValues, setInitialValues] = useState<any>({
    occupation: [],
  });
  const { sendApiRequest, fetchData } = useHttp();

  const handleSubmit = (values: any) => {
    sendApiRequest(
      {
        method: REQUEST_METHOD.PATCH,
        data: values,
        endpoint: API_ENDPOINT.getPlanningOccupation(sessionId),
      },
      () => {
        updateProceedToNext();
      },
    );
  };

  const saveAndSetInitialvalues = (values: any) => {
    sendApiRequest(
      {
        method: REQUEST_METHOD.PATCH,
        data: values,
        endpoint: API_ENDPOINT.getPlanningOccupation(sessionId),
      },
      () => {
        if (sessionId) {
          fetchData({ endpoint: API_ENDPOINT.getPlanningOccupation(sessionId) }, (data: any) => {
            if (data && data?.length > 0) {
              setInitialValues({ occupation: data });
            }
          });
        }
      },
    );
  };

  useEffect(() => {
    if (sessionId) {
      fetchData({ endpoint: API_ENDPOINT.getPlanningOccupation(sessionId) }, (data: any) => {
        if (data && data?.length > 0) {
          setInitialValues({ occupation: data });
        }
      });
    }
  }, [sessionId]);

  return { handleSubmit, initialValues, saveAndSetInitialvalues };
};
