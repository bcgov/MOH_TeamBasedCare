import { useOccupations } from 'src/services/useOccupations';
import { OccupationItem } from './OccupationItem';
import { isOdd } from 'src/common/util';

export const OccupationSelector = ({}) => {
  const { occupations } = useOccupations();

  return (
    <div className='flex-1 flex flex-col'>
      {occupations.map((occupation, index) => {
        const styling = isOdd(index) ? 'occupation-item-box-gray' : 'occupation-item-box-white';
        return (
          <div key={index} className={`occupation-item-box ${styling}`}>
            <OccupationItem key={occupation.id} {...occupation}></OccupationItem>
          </div>
        );
      })}
    </div>
  );
};
