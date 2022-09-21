import { useOccupations } from 'src/services/useOccupations';
import { OccupationItem } from './OccupationItem';
import { isOdd } from 'src/common/util';
import { useOccupationSearchContext } from './planning/Occupation';

export const OccupationSelector = ({}) => {
  const { occupations } = useOccupations();
  const { occupationSearch } = useOccupationSearchContext();
  // Filter data with search value

  const filteredData =
    occupations &&
    occupations.filter((occupation: any) => {
      return occupation.displayName.toLowerCase().includes(occupationSearch.toLowerCase());
    });
  return (
    <div>
      {filteredData.length !== 0 ? (
        filteredData.map((occupation, index) => {
          const styling = isOdd(index) ? 'occupation-item-box-gray' : 'occupation-item-box-white';
          return (
            <div key={index} className={`occupation-item-box ${styling}`}>
              <OccupationItem key={occupation.id} {...occupation}></OccupationItem>
            </div>
          );
        })
      ) : (
        <p className='text-bcDarkBlue'>Data not found</p>
      )}
    </div>
  );
};
