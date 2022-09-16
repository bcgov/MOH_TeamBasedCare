import { useEffect, useState } from 'react';
import { API_ENDPOINT } from '../common';
import { useHttp } from './useHttp';
import { CommonDBItem } from '../common/interfaces';

interface OccupationProps extends CommonDBItem {
  name: string;
  displayName: string;
  isRegulated: boolean;
}

export const useOccupations = () => {
  const { fetchData, isLoading } = useHttp();
  const [occupations, setOccupations] = useState<OccupationProps[]>([]);

  useEffect(() => {
    const config = { endpoint: API_ENDPOINT.OCCUPATIONS };

    fetchData(config, (data: OccupationProps[]) => {
      console.log(data);
      setOccupations(data);
    });
  }, []);

  return { occupations, isLoading };
};
