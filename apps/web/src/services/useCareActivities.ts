import { useEffect, useState } from 'react';
import { API_ENDPOINT } from '../common';
import { useHttp } from './useHttp';
import { usePlanningContext } from './usePlanningContext';
import { BundleRO } from '@tbcm/common';

interface CareActivityInterface {
  result: BundleRO[];
}

export const useCareActivities = () => {
  const { fetchData, isLoading } = useHttp();
  const {
    state: { sessionId },
  } = usePlanningContext();
  const [careActivities, setCareActivities] = useState<CareActivityInterface>();

  useEffect(() => {
    const config = {
      endpoint: API_ENDPOINT.getPlanningCareActivityBundlesForSessionCareLocation(sessionId),
    };

    fetchData(config, (data: BundleRO[]) => {
      setCareActivities({ result: data });
    });
  }, []);

  return { careActivities, isLoading };
};
