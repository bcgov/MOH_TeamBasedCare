import { useOccupations } from 'src/services/useOccupations';
import { OccupationItem } from './OccupationItem';
import { isOdd } from 'src/common/util';
import { occupationItemBoxGray, occupationItemBoxWhite } from 'src/styles/styles';

export const OccupationSelector = ({ selectedOccupations, setSelectedOccupations }: any) => {
  const { occupations } = useOccupations();

  return (
    <div>
      {occupations.map((occupation, index) => {
        const styling = isOdd(index) ? occupationItemBoxGray : occupationItemBoxWhite;
        return (
          <div key={index} className={styling}>
            <OccupationItem
              selectedOccupations={selectedOccupations}
              setSelectedOccupations={setSelectedOccupations}
              key={occupation.id}
              {...occupation}
            ></OccupationItem>
          </div>
        );
      })}
    </div>
  );
};
