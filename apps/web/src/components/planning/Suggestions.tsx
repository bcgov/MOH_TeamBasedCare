
import {PlanningStepHeader} from '@components';
export interface SuggestionsProps {
  step: number;
  title: string;
}

export const Suggestions: React.FC<SuggestionsProps> = ({ step, title }) => {
  return (
    <>
        <PlanningStepHeader>{title}</PlanningStepHeader>
        
    </>
  );
};