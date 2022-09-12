import {PlanningStepHeader, Radio } from '@components';
import { Field } from 'formik';


export interface ProfileProps {
  step: number;
  title: string;
}

export const profileOptions = [
  {
    label: "Start from a generic profile",
    value: 'generic',
  },
  {
    label: "Start a new profile from scratch",
    value: 'scratch',
  }
];

export const Profile: React.FC<ProfileProps> = ({ step, title }) => {

  return (
    <>
        {/* <PlanningStepHeader>{title}</PlanningStepHeader> */}
        {/* <Textfield type="text" name="asdasdasd" label="qwerty" description="asdasdsadasdasdasdadd"/> */}
      
        {/* <label htmlFor="Profile">Profile
        <Field id="Profile" name="Profile"  className={
            `w-full rounded-none bg-gray-100 block h-10
            border-b-2 border-bcBlack pl-1 disabled:bg-bcDisabled`
            
        } placeholder="Profile" /></label> */}

        <Radio 
          legend="Select how do you want to start with"  
          name="Profile" 
          options={profileOptions} 
          />
        
    </>
  );
};