import React from 'react';
import { Label } from './Label';
import axios from 'axios';
axios.defaults.baseURL = 'http://localhost:4000/api/v1';

interface CareUnitProps {
  id: string;
  unitName: string;
}

export const Dropdown = () => {
  const [careUnits, setCareUnits] = React.useState([]);

  React.useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get('/carelocations');
      const data = res.data;
      setCareUnits(data);
    };
    fetchData();
  }, []);

  return (
    <div>
      <Label htmlFor='test'>
        {'Select Care Location Profile'}
        <select
          defaultValue='ICU'
          id='careunits'
          className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
        >
          {careUnits.map((unit: CareUnitProps) => {
            return (
              <option key={unit.id} value={unit.unitName}>
                {unit.unitName}
              </option>
            );
          })}
          <option value='test1'>Filler Unit 1</option>
          <option value='test2'>Filler Unit 2</option>
          <option value='test2'>Filler Unit 3</option>
        </select>
      </Label>
    </div>
  );
};
