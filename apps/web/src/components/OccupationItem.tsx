import { Checkbox } from './Checkbox';
import { OccupationItemProps } from 'src/common/interfaces';
import React from 'react';

export const OccupationItem = ({ id, displayName }: OccupationItemProps) => {
  // const tagText = isRegulated ? 'Regulated' : 'Unregulated';
  // const tagColor = isRegulated ? TagVariants.BLUE : TagVariants.GREEN;

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

      {/** No need to show occupation tag: All occupations are regulated for now. */}
      {/** changes: (1/2) w-5/6 changed to w-full for Checkbox's parent div */}
      {/** changes: (2/2) commented Tag element */}

      {/* <div className='flex flex-initial w-1/6 justify-end'>
        <Tag text={tagText} tagStyle={tagColor}></Tag>
      </div> */}
    </div>
  );
};
