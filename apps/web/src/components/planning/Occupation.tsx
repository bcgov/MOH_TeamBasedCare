import { PlanningStepHeader } from '@components';
import { planningFormBox } from '../../styles/styles';

export interface OccupationProps {
  step: number;
  title: string;
}

export const Occupation: React.FC<OccupationProps> = ({ title }) => {
  return (
    <div className={planningFormBox}>
      <PlanningStepHeader>{title}</PlanningStepHeader>
    </div>
  );
};
