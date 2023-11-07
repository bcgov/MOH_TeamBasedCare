import { useCallback, useEffect, useState } from 'react';
import { API_ENDPOINT } from '../common';
import { useHttp } from './useHttp';
import { OccupationItemProps } from '../common/interfaces';

export const useOccupationById = (id: string) => {
  const { fetchData, isLoading } = useHttp();
  const [occupation, setOccupation] = useState<OccupationItemProps>();

  const fetchOccupation = useCallback(() => {
    if (!id) return; // no api call if the id not available

    const config = { endpoint: API_ENDPOINT.getOccupationsById(id) };

    fetchData(config, (data: OccupationItemProps) => {
      setOccupation(data);
    });
  }, [fetchData, id]);

  useEffect(() => {
    fetchOccupation();
  }, [fetchOccupation]);

  return { occupation, isLoading };
};
