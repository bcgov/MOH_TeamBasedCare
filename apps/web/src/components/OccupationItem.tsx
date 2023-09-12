import { Checkbox } from './Checkbox';
import { OccupationItemProps } from 'src/common/interfaces';
import React from 'react';

export const OccupationItem = ({ id, displayName }: OccupationItemProps) => {
  return (
    <div className='flex flex-1 items-center'>
      <div className='flex-initial w-full'>
        <Checkbox
          name='occupation'
          value={id}
          styles='text-bcDarkBlue accent-bcBlueLink'
          label={displayName}
        ></Checkbox>
      </div>
    </div>
  );
};
