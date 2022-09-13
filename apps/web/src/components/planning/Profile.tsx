import { Radio } from '@components';
import { useState } from 'react';
import { CareLocationSelector } from '../CareLocationSelector';
import { planningFormBox } from '../../styles/styles';

export interface ProfileProps {
  step: number;
  title: string;
}

export const profileOptions = [
  {
    label: 'Start from a generic profile',
    value: 'generic',
    selected: false,
  },
  {
    label: 'Start a new profile from scratch',
    value: 'scratch',
    selected: false,
  },
];

export const Profile: React.FC<ProfileProps> = () => {
  const [displayDropdown, setDisplayDropdown] = useState(false);

  const handleSelect = (e: any) => {
    const { value } = e.target;

    if (value === 'generic') {
      setDisplayDropdown(true);
    } else {
      setDisplayDropdown(false);
    }
  };
  return (
    <div>
      <div className={planningFormBox}>
        {/* <PlanningStepHeader>{title}</PlanningStepHeader> */}
        {/* <Textfield type="text" name="asdasdasd" label="qwerty" description="asdasdsadasdasdasdadd"/> */}

        {/* <label htmlFor="Profile">Profile
        <Field id="Profile" name="Profile"  className={
            `w-full rounded-none bg-gray-100 block h-10
            border-b-2 border-bcBlack pl-1 disabled:bg-bcDisabled`
            
        } placeholder="Profile" /></label> */}

        <Radio
          legend='Select how do you want to start with'
          name='Profile'
          options={profileOptions}
          handleSelect={handleSelect}
        />
      </div>
      <div>
        <div>
          {displayDropdown ? (
            <div className={planningFormBox}>
              <CareLocationSelector />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
