import { useEffect, useState } from 'react';
import { API_ENDPOINT } from '../common';
import { useHttp } from './useHttp';
import { OccupationItemProps } from '../common/interfaces';

export const useOccupations = () => {
  const { fetchData, isLoading } = useHttp();
  const [occupations, setOccupations] = useState<OccupationItemProps[]>([]);

  useEffect(() => {
    const config = { endpoint: API_ENDPOINT.OCCUPATIONS };

    fetchData(config, (data: OccupationItemProps[]) => {
      setOccupations(data);
    });
  }, []);

  return { occupations, isLoading };
};
