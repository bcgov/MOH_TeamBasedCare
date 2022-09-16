import { useOccupations } from 'src/services/useOccupations';
import { OccupationItem } from './OccupationItem';
import { isOdd } from 'src/common/util';

export const OccupationSelector = () => {
  const { occupations } = useOccupations();

  // Initially were imported from Styles, but for some reason would break the application
  // Putting them here for now.
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
