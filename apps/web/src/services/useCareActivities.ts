import { useEffect, useState } from 'react';
import { API_ENDPOINT } from '../common';
// import { OptionType } from '../components/generic/RenderSelect';
import { useHttp } from './useHttp';
import { usePlanningContext } from './usePlanningContext';

interface CareActivityInterface {
  result: any[];
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

    fetchData(config, (data: any) => {
      setCareActivities({ result: data });
    });
  }, []);

  return { careActivities, isLoading };
};
