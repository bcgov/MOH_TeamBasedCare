import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { useHttp } from './useHttp';
import { usePlanningContext } from './usePlanningContext';

interface usePlanningOccupationsProps {
  proceedToNextOnSubmit?: boolean;
  triggerActivityGapFetchOnSubmit?: boolean;
}

export const usePlanningOccupations = ({
  proceedToNextOnSubmit = false,
}: usePlanningOccupationsProps) => {
  const {
    state: { sessionId, refetchActivityGap },
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
        // proceed to next step (planning context changes) if requested
        if (proceedToNextOnSubmit) {
          updateProceedToNext();
        }
      },
    );
  };

  const updateOccupationsForSessionId = useCallback(() => {
    fetchData({ endpoint: API_ENDPOINT.getPlanningOccupation(sessionId) }, (data: any) => {
      if (data && data?.length > 0) {
        setInitialValues({ occupation: data });
      }
    });
  }, [fetchData, sessionId, refetchActivityGap]);

  useEffect(() => {
    if (sessionId) {
      updateOccupationsForSessionId();
    }
  }, [sessionId, updateOccupationsForSessionId]);

  return { handleSubmit, initialValues, updateOccupationsForSessionId };
};
