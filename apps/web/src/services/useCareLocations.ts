import { useEffect, useState } from 'react';
import { REQUEST_METHOD } from '../common';
import { useHttp } from './useHttp';

interface UnitProps {
  id: string;
  unitName: string;
}

export const useCareLocations = () => {
  const http = useHttp();
  const [careLocations, setCareLocations] = useState([]);

  useEffect(() => {
    (async () => {
      const config = { endpoint: '/carelocations', method: REQUEST_METHOD.GET };

      await http.fetchData(config, (data: any) => {
        setCareLocations(
          data.map((unit: UnitProps) => {
            return { ...unit, value: unit.unitName };
          }),
        );
      });
    })();
  }, []);

  return { careLocations };
};
