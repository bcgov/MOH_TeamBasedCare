import React from 'react';
import { Label } from './Label';

interface DropdownOptionProps {
  id: string;
  value: string;
}
interface DropdownProps {
  dropdownOptions: DropdownOptionProps[];
}

export const Dropdown = ({ dropdownOptions }: DropdownProps) => {
  return (
    <div>
      <Label htmlFor='test'>
        {'Select Care Location Profile'}
        <select
          defaultValue='ICU'
          id='careunits'
          className='bg-gray-200 border-b-2 border-gray-900 text-gray-900 text-sm rounded-sm focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5'
        >
          {dropdownOptions.map((option: DropdownOptionProps) => {
            return (
              <option key={option.id} value={option.value}>
                {option.value}
              </option>
            );
          })}
        </select>
      </Label>
    </div>
  );
};
