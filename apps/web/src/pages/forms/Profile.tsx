import {FormStepHeader} from '@components';

export interface ProfileProps {
  step: number;
  title: string;
}

export const Profile: React.FC<ProfileProps> = ({ step, title }) => {
  return (
    <>
        <FormStepHeader>{title}</FormStepHeader>
        
    </>
  );
};