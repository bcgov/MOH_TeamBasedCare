import { Checkbox } from './Checkbox';
import { OccupationItemProps } from 'src/common/interfaces';

export const OccupationItem = ({ displayName, isRegulated }: OccupationItemProps) => {
  return (
    <div className='flex flex-1'>
      <div className='flex-initial w-5/6'>
        <Checkbox name={displayName} label={displayName}></Checkbox>
      </div>
      <div className='flex flex-initial w-1/6 justify-end'>
        {isRegulated ? <p>Regulated</p> : <p>Unregulated</p>}
      </div>
    </div>
  );
};
