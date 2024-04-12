import { useEffect, useState } from 'react';
import { API_ENDPOINT } from '../common';
import { OptionType } from '../components/generic/RenderSelect';
import { useHttp } from './useHttp';
import { UnitRO } from '@tbcm/common';

export const useCareLocations = () => {
  const { fetchData, isLoading } = useHttp();
  const [careLocations, setCareLocations] = useState<OptionType[]>([]);

  useEffect(() => {
    const config = { endpoint: API_ENDPOINT.CARE_LOCATIONS };

    fetchData(config, (data: UnitRO[]) => {
      setCareLocations(
        data.map(unit => {
          return { value: unit.id, label: unit.displayName };
        }),
      );
    });
  }, []);

  return { careLocations, isLoading };
};
