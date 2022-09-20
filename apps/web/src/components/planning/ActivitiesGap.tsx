import { PlanningStepHeader } from '@components';

export interface ActivitiesGapProps {
  step: number;
  title: string;
}

export const ActivitiesGap: React.FC<ActivitiesGapProps> = ({ title }) => {
  return (
    <div className='planning-form-box'>
      <PlanningStepHeader>{title}</PlanningStepHeader>
      <label htmlFor='ActivitiesGap'>ActivitiesGap</label>
    </div>
  );
};
