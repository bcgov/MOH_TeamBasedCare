
import {FormStepHeader} from '@components';
export interface OccupationProps {
  step: number;
  title: string;
}

export const Occupation: React.FC<OccupationProps> = ({ step, title }) => {
  return (
    <>
        <FormStepHeader>{title}</FormStepHeader>
    </>
  );
};