import { PlanningStepHeader } from '@components';
import { planningFormBox } from '../../styles/styles';

export interface SuggestionsProps {
  step: number;
  title: string;
}

export const Suggestions: React.FC<SuggestionsProps> = ({ title }) => {
  return (
    <div className={planningFormBox}>
      <PlanningStepHeader>{title}</PlanningStepHeader>
    </div>
  );
};
