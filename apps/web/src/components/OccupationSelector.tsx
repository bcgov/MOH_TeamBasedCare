import { useOccupations } from 'src/services/useOccupations';
import { OccupationItem } from './OccupationItem';

export const OccupationSelector = () => {
  const { occupations } = useOccupations();
  return (
    <div>
      {occupations.map(occupation => {
        return <OccupationItem key={occupation.id} {...occupation}></OccupationItem>;
      })}
    </div>
  );
};
