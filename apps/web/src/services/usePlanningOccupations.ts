import { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { useHttp } from './useHttp';
import { usePlanningContext } from './usePlanningContext';

interface usePlanningOccupationsProps {
  proceedToNextOnSubmit?: boolean;
  triggerActivityGapFetchOnSubmit?: boolean;
}

export interface PlanningOccupation {
  occupation: string[];
  unavailableOccupations: string[];
}

export const usePlanningOccupations = ({
  proceedToNextOnSubmit = false,
}: usePlanningOccupationsProps) => {
  const {
    state: { sessionId, refetchActivityGap },
    updateProceedToNext,
  } = usePlanningContext();

  const [initialValues, setInitialValues] = useState<PlanningOccupation>({
    occupation: [],
    unavailableOccupations: [],
  });

  const { sendApiRequest, fetchData } = useHttp();

  const handleSubmit = (values: PlanningOccupation) => {
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
    fetchData(
      { endpoint: API_ENDPOINT.getPlanningOccupation(sessionId) },
      (data: { occupation: string[]; unavailableOccupations: string[] }) => {
        if (data) {
          setInitialValues({
            occupation: data.occupation || [],
            unavailableOccupations: data.unavailableOccupations || [],
          });
        }
      },
    );
  }, [fetchData, sessionId, refetchActivityGap]);

  useEffect(() => {
    if (sessionId) {
      updateOccupationsForSessionId();
    }
  }, [sessionId, updateOccupationsForSessionId]);

  return { handleSubmit, initialValues, updateOccupationsForSessionId };
};
