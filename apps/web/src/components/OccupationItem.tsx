import { Checkbox } from './Checkbox';
import { OccupationItemProps } from 'src/common/interfaces';
import { Tag } from './generic/Tag';
import { TagStyles } from 'src/common';
import React from 'react';

export const OccupationItem = ({
  id,
  displayName,
  isRegulated,
  setSelectedOccupations,
  selectedOccupations,
}: OccupationItemProps) => {
  const tagText = isRegulated ? 'Regulated' : 'Unregulated';
  const tagColor = isRegulated ? TagStyles.BLUE : TagStyles.GREEN;
  const checkboxTicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!setSelectedOccupations || !selectedOccupations) return;

    if (e.currentTarget.checked) {
      // Add ID to array
      setSelectedOccupations([...selectedOccupations, id]);
    } else {
      // Remove ID from array
      const index = selectedOccupations.indexOf(id);
      if (index !== -1) {
        setSelectedOccupations([
          ...selectedOccupations.slice(0, index),
          ...selectedOccupations.slice(index + 1),
        ]);
      }
    }
  };
  return (
    <div className='flex flex-1 items-center'>
      <div className='flex-initial w-5/6'>
        <Checkbox name={displayName} label={displayName} handleChange={checkboxTicked}></Checkbox>
      </div>
      <div className='flex flex-initial w-1/6 justify-end'>
        <Tag text={tagText} tagStyle={tagColor}></Tag>
      </div>
    </div>
  );
};
