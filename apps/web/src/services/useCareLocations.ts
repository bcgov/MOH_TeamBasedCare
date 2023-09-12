import { useEffect, useState } from 'react';
import { API_ENDPOINT } from '../common';
import { OptionType } from '../components/generic/RenderSelect';
import { useHttp } from './useHttp';

interface UnitProps {
  id: string;
  displayName: string;
}

export const useCareLocations = () => {
  const { fetchData, isLoading } = useHttp();
  const [careLocations, setCareLocations] = useState<OptionType[]>([]);

  useEffect(() => {
    const config = { endpoint: API_ENDPOINT.CARE_LOCATIONS };

    fetchData(config, (data: any) => {
      setCareLocations(
        data.map((unit: UnitProps) => {
          return { value: unit.id, label: unit.displayName };
        }),
      );
    });
  }, []);

  return { careLocations, isLoading };
};
