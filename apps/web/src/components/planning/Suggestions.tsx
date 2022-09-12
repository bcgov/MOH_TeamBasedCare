import { PlanningStepHeader } from '@components';
import { formFormatting } from '../../common';
export interface SuggestionsProps {
  step: number;
  title: string;
}

export const Suggestions: React.FC<SuggestionsProps> = ({ title }) => {
  return (
    <div className={formFormatting}>
      <PlanningStepHeader>{title}</PlanningStepHeader>
    </div>
  );
};
