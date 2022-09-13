import React from 'react';
import { Dropdown } from './Dropdown';
import { useCareLocations } from '../services/useCareLocations';

export const CareLocationSelector = () => {
  const { careLocations } = useCareLocations();
  return (
    <>
      <Dropdown dropdownOptions={careLocations}></Dropdown>
    </>
  );
};
