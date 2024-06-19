import { useState, useEffect } from 'react';
import { API_ENDPOINT } from '../common';
import { useHttp } from './useHttp';
import { usePlanningContext } from './usePlanningContext';
import { ActivityGap } from '@tbcm/common';

export const usePlanningActivitiesGap = () => {
  const {
    state: { sessionId, refetchActivityGap },
    updateRefetchActivityGap,
  } = usePlanningContext();
  const [initialValues, setInitialValues] = useState<ActivityGap>({
    headers: [],
    overview: {},
    data: [],
  });
  const { fetchData, isLoading } = useHttp();
  const [isValidSession, setIsValidSession] = useState<boolean>();

  useEffect(() => {
    if (sessionId || refetchActivityGap) {
      // after initiating trigger of updated date, mark it false;
      updateRefetchActivityGap(false);

      fetchData(
        { endpoint: API_ENDPOINT.getPlanningActivityGap(sessionId) },
        (data: ActivityGap) => {
          if (data && Object.keys(data).length > 0) {
            setInitialValues(data);
          }
        },
      );
    }
  }, [sessionId, refetchActivityGap, fetchData]);

  useEffect(() => {
    const { data, headers } = initialValues;
    if (!data || !headers) return;
    setIsValidSession(data.length !== 0 && headers.length > 1);
  }, [initialValues]);

  return { initialValues, isLoading, isValidSession };
};
