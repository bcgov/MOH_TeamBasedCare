import { PlanningStepHeader } from '@components';
import { planningFormBox } from '../../styles/styles';

export interface CareActivitiesBundleProps {
  step: number;
  title: string;
}

export const CareActivitiesBundle: React.FC<CareActivitiesBundleProps> = ({ title }) => {
  return (
    <div className={planningFormBox}>
      <PlanningStepHeader>{title}</PlanningStepHeader>
    </div>
  );
};
