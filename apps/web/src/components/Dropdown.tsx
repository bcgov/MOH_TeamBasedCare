import React from 'react';
import { DropdownOptions } from './generic/DropdownOptions';
import { planningFormDropdown } from '../styles/styles';

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
      <DropdownOptions
        label={{ htmlFor: 'test', text: 'Select Care Location Profile' }}
        options={dropdownOptions}
        select={{ id: 'careunits', defaultValue: 'ICU', styling: planningFormDropdown }}
      ></DropdownOptions>
    </div>
  );
};
