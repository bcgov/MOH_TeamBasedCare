
import {FormStepHeader} from '@components';
export interface ActivitiesGapProps {
  step: number;
  title: string;
}

export const ActivitiesGap: React.FC<ActivitiesGapProps> = ({ step, title }) => {
  return (
    <>
        <FormStepHeader>{title}</FormStepHeader>
        
    </>
  );
};