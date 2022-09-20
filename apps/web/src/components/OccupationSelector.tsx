import { useOccupations } from 'src/services/useOccupations';
import { OccupationItem } from './OccupationItem';
import { isOdd } from 'src/common/util';

export const OccupationSelector = ({}) => {
  const { occupations } = useOccupations();

  // Have to declare them here because importing from styles.ts
  // breaks it, I don't know why.
  const occupationItemBox = 'flex items-center h-16 px-4';
  const occupationItemBoxGray = `${occupationItemBox} bg-bcLightGray shadow-xs`;
  const occupationItemBoxWhite = `${occupationItemBox} shadow-x`;

  return (
    <div>
      {occupations.map((occupation, index) => {
        const styling = isOdd(index) ? occupationItemBoxGray : occupationItemBoxWhite;
        return (
          <div key={index} className={styling}>
            <OccupationItem key={occupation.id} {...occupation}></OccupationItem>
          </div>
        );
      })}
    </div>
  );
};
