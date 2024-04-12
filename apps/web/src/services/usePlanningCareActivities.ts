import { useState, useEffect } from 'react';
import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { useHttp } from './useHttp';
import { usePlanningContext } from './usePlanningContext';
import { SaveCareActivityDTO } from '@tbcm/common';

export const usePlanningCareActivities = () => {
  const {
    state: { sessionId },
    updateProceedToNext,
  } = usePlanningContext();
  const [initialValues, setInitialValues] = useState({
    careActivities: [],
    careActivityBundle: {},
    careActivityID: '',
  });
  const { sendApiRequest, fetchData } = useHttp();

  const handleSubmit = (values: SaveCareActivityDTO) => {
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
      fetchData(
        { endpoint: API_ENDPOINT.getPlanningCareActivity(sessionId) },
        (data: { [key: string]: string[] | undefined }) => {
          if (data && Object.keys(data).length > 0) {
            setInitialValues({
              careActivities: [],
              careActivityBundle: data,
              careActivityID: '',
            });
          }
        },
      );
    }
  }, [sessionId]);

  return { handleSubmit, initialValues };
};
