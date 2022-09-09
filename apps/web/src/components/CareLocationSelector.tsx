import React from 'react';
import { Dropdown } from './Dropdown';
import { getCareLocations } from '../services/carelocations';

interface UnitProps {
  id: string;
  unitName: string;
}

export const CareLocationSelector = () => {
  const [careLocations, setCareLocations] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      setCareLocations(
        (await getCareLocations()).map((unit: UnitProps) => ({ ...unit, value: unit.unitName })),
      );
    })();
  }, []);

  return (
    <>
      <Dropdown dropdownOptions={careLocations}></Dropdown>
    </>
  );
};
