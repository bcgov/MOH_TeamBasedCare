import { PlanningStepHeader } from '@components';

export interface CareActivitiesBundleProps {
  step: number;
  title: string;
}

export const CareActivitiesBundle: React.FC<CareActivitiesBundleProps> = ({ title }) => {
  return (
    <div className='planning-form-box'>
      <PlanningStepHeader>{title}</PlanningStepHeader>
    </div>
  );
};
