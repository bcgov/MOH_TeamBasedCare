import {PlanningStepHeader} from '@components';
export interface CareActivitiesBundleProps {
  step: number;
  title: string;
}

export const CareActivitiesBundle: React.FC<CareActivitiesBundleProps> = ({ step, title }) => {
  return (
    <>
        <PlanningStepHeader>{title}</PlanningStepHeader>
        
    </>
  );
};