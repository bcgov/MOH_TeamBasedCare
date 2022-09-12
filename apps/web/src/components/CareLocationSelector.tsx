import React from 'react';
import { Dropdown } from './Dropdown';
import { useHttp } from '../services/useHttp';
import { REQUEST_METHOD } from '../common';

interface UnitProps {
  id: string;
  unitName: string;
}

export const CareLocationSelector = () => {
  const http = useHttp();
  const [careLocations, setCareLocations] = React.useState([]);

  React.useEffect(() => {
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

  return (
    <>
      <Dropdown dropdownOptions={careLocations}></Dropdown>
    </>
  );
};
