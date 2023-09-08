import { IProfileSelection } from '@tbcm/common';
import { useState, useEffect } from 'react';
import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { useHttp } from './useHttp';
import { usePlanningContext } from './usePlanningContext';

export const usePlanningProfile = () => {
  const {
    state: { sessionId },
    updateProceedToNext,
  } = usePlanningContext();
  const [initialValues, setInitialValues] = useState<any>({
    profileOption: '',
    careLocation: '',
  });
  const { sendApiRequest, fetchData } = useHttp();

  const handleSubmit = (values: any) => {
    sendApiRequest(
      {
        method: REQUEST_METHOD.PATCH,
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
      fetchData({ endpoint: API_ENDPOINT.getPlanningProfile(sessionId) }, (data: IProfileSelection) => {
        if (data) {
          setInitialValues(data);
        }
      });
    }
  }, [sessionId]);

  return { handleSubmit, initialValues };
};
