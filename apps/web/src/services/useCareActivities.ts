import { useEffect, useState } from 'react';
import { API_ENDPOINT } from '../common';
// import { OptionType } from '../components/generic/RenderSelect';
import { useHttp } from './useHttp';

interface CareActivityInterface {
  total: number;
  count: number;
  result: any[];
}

export const useCareActivities = () => {
  const { fetchData, isLoading } = useHttp();
  const [careActivities, setCareActivities] = useState<CareActivityInterface>();

  useEffect(() => {
    const config = { endpoint: API_ENDPOINT.CARE_ACTIVITIES };

    fetchData(config, (data: any) => {
      setCareActivities(data);
    });
  }, []);

  return { careActivities, isLoading };
};
