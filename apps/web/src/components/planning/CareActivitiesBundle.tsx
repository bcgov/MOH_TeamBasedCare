import { PlanningStepHeader } from '@components';
import { formFormatting } from '../../common';
export interface CareActivitiesBundleProps {
  step: number;
  title: string;
}

export const CareActivitiesBundle: React.FC<CareActivitiesBundleProps> = ({ title }) => {
  return (
    <div className={formFormatting}>
      <PlanningStepHeader>{title}</PlanningStepHeader>
    </div>
  );
};
