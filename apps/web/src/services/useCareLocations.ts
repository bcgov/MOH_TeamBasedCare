import { useEffect, useState } from 'react';
import { API_ENDPOINT } from '../common';
import { useHttp } from './useHttp';

interface UnitProps {
  id: string;
  unitName: string;
}

export const useCareLocations = () => {
  const { fetchData, isLoading } = useHttp();
  const [careLocations, setCareLocations] = useState();

  useEffect(() => {
    const config = { endpoint: API_ENDPOINT.CARE_LOCATIONS };

    fetchData(config, (data: any) => {
      setCareLocations(
        data.map((unit: UnitProps) => {
          return { ...unit, value: unit.unitName };
        }),
      );
    });
  }, []);

  return { careLocations, isLoading };
};
