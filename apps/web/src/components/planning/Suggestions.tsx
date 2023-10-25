import { PlanningStepHeader } from '@components';

export interface SuggestionsProps {
  step: number;
  title: string;
}

export const Suggestions: React.FC<SuggestionsProps> = ({ title }) => {
  return (
    <div className='planning-form-box'>
      <PlanningStepHeader>{title}</PlanningStepHeader>
    </div>
  );
};
