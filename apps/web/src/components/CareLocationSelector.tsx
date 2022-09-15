import React from 'react';
import { useCareLocations } from '../services/useCareLocations';
import { Dropdown } from './generic/Dropdown';

export const CareLocationSelector = () => {
  const { careLocations } = useCareLocations();
  return (
    <>
      <Dropdown
        label={'Select Care Location Profile'}
        options={careLocations}
        id='careunits'
      ></Dropdown>
    </>
  );
};
