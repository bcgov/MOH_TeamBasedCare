
import {FormStepHeader} from '@components';
export interface SuggestionsProps {
  step: number;
  title: string;
}

export const Suggestions: React.FC<SuggestionsProps> = ({ step, title }) => {
  return (
    <>
        <FormStepHeader>{title}</FormStepHeader>
        
    </>
  );
};