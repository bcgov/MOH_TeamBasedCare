import { OccupationItemProps } from 'src/common/interfaces';

interface OccupationalScopeDetailsProps {
  occupation?: OccupationItemProps;
}
export const OccupationalScopeDetails: React.FC<OccupationalScopeDetailsProps> = ({
  occupation,
}) => {
  return <>{occupation?.description}</>;
};
