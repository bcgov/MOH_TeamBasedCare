import { useEffect, useState } from 'react';
import { API_ENDPOINT } from '../common';
import { useHttp } from './useHttp';

interface ActivitiesGapInterface {
  result: any[];
}

export const useActivitiesGap = () => {
  const { fetchData, isLoading } = useHttp();
  const [activitiesGap, setActivitiesGap] = useState<ActivitiesGapInterface>();

  useEffect(() => {
    const config = { endpoint: API_ENDPOINT.CARE_ACTIVITIES };

    fetchData(config, (data: any) => {
      setActivitiesGap(data);
    });
  }, []);

  return { activitiesGap, isLoading };
};
