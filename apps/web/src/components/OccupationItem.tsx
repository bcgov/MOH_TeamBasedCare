import { Checkbox } from './Checkbox';
import { OccupationItemProps } from 'src/common/interfaces';
import { Tag } from './generic/Tag';
import { TagStyles } from 'src/common';
import React from 'react';

export const OccupationItem = ({ id, displayName, isRegulated }: OccupationItemProps) => {
  const tagText = isRegulated ? 'Regulated' : 'Unregulated';
  const tagColor = isRegulated ? TagStyles.BLUE : TagStyles.GREEN;

  return (
    <div className='flex flex-1 items-center'>
      <div className='flex-initial w-5/6'>
        <Checkbox
          name='occupation'
          value={id}
          styles='text-bcDarkBlue accent-bcBlueLink'
          label={displayName}
        ></Checkbox>
      </div>
      <div className='flex flex-initial w-1/6 justify-end'>
        <Tag text={tagText} tagStyle={tagColor}></Tag>
      </div>
    </div>
  );
};
