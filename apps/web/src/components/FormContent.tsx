import { FormStepHeader }  from '@components';
import {Profile}  from '../pages/forms/Profile';
import {CareActivitiesBundle} from '../pages/forms/CareActivitiesBundle';
import {Occupation} from '../pages/forms/Occupation';
import {ActivitiesGap} from '../pages/forms/ActivitiesGap';
import {Suggestions} from '../pages/forms/Suggestions';

interface FormContentProps {
  step: number;
  formTitle: string;
}

export const FormContent: React.FC<FormContentProps> = ({step, formTitle}) => {
  const stepCount = step;

  const showStepContent =()=> {
    switch (String(step)) {
      case "1": 
        return <Profile title={formTitle} step={step} />;
      case "2":
        return <CareActivitiesBundle  title={formTitle} step={step} />;
      case "3":
        return <Occupation  title={formTitle} step={step} />;
      case "4":
        return <ActivitiesGap  title={formTitle} step={step} />;
      case "5":
        return <Suggestions  title={formTitle} step={step} />;
    }

  }
  return (
    <>
      <p className='sr-only'>
        {step <= stepCount ? `Form step ${step} of ${stepCount}` : 'Form Complete'}
      </p>
      {showStepContent()}
    </>
  );
};