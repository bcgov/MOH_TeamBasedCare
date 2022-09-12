import { PlanningStepHeader } from '@components';
import { formFormatting } from '../../common';

export interface OccupationProps {
  step: number;
  title: string;
}

export const Occupation: React.FC<OccupationProps> = ({ title }) => {
  return (
    <div className={formFormatting}>
      <PlanningStepHeader>{title}</PlanningStepHeader>
    </div>
  );
};
