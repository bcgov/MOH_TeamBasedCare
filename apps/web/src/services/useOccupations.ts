import { useCallback, useEffect, useState } from 'react';
import { API_ENDPOINT } from '../common';
import { useHttp } from './useHttp';
import { OccupationItemProps } from '../common/interfaces';

export const useOccupations = () => {
  const { fetchData, isLoading } = useHttp();
  const [occupations, setOccupations] = useState<OccupationItemProps[]>([]);

  const fetchOccupations = useCallback(() => {
    const config = { endpoint: API_ENDPOINT.OCCUPATIONS };

    fetchData(config, (data: OccupationItemProps[]) => {
      setOccupations(data);
    });
  }, [fetchData]);

  useEffect(() => {
    fetchOccupations();
  }, [fetchOccupations]);

  return { occupations, isLoading };
};
