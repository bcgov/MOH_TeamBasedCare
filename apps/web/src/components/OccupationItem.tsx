import { Checkbox } from './Checkbox';
import { OccupationItemProps } from 'src/common/interfaces';
import { Tag } from './generic/Tag';
import { TagStyles } from 'src/common';

export const OccupationItem = ({ displayName, isRegulated }: OccupationItemProps) => {
  const tagText = isRegulated ? 'Regulated' : 'Unregulated';
  const tagColor = isRegulated ? TagStyles.BLUE : TagStyles.GREEN;
  return (
    <div className='flex flex-1 items-center'>
      <div className='flex-initial w-5/6'>
        <Checkbox name={displayName} label={displayName}></Checkbox>
      </div>
      <div className='flex flex-initial w-1/6 justify-end'>
        <Tag text={tagText} tagStyle={tagColor}></Tag>
      </div>
    </div>
  );
};
