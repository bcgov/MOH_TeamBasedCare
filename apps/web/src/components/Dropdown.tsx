import React from 'react';
import { Label } from './Label';
import { getCareLocations } from '../services/carelocations';

interface CareUnitProps {
  id: string;
  unitName: string;
}

export const Dropdown = () => {
  const [careUnits, setCareUnits] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      setCareUnits(await getCareLocations());
    })();
  }, []);

  return (
    <div>
      <Label htmlFor='test'>
        {'Select Care Location Profile'}
        <select
          defaultValue='ICU'
          id='careunits'
          className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5'
        >
          {careUnits.map((unit: CareUnitProps) => {
            return (
              <option key={unit.id} value={unit.unitName}>
                {unit.unitName}
              </option>
            );
          })}
        </select>
      </Label>
    </div>
  );
};
