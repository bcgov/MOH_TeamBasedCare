import {Profile}  from '../pages/forms/Profile';
import {CareActivitiesBundle} from '../pages/forms/CareActivitiesBundle';
import {Occupation} from '../pages/forms/Occupation';
import {ActivitiesGap} from '../pages/forms/ActivitiesGap';
import {Suggestions} from '../pages/forms/Suggestions';

interface PlanningContentProps {
  step: number;
  formTitle: string;
}

export const PlanningContent: React.FC<PlanningContentProps> = ({step, formTitle}) => {

  const showStepContent =()=> {
    switch (formTitle) {
      case "Profile": 
        return <Profile title={formTitle} step={step} />;
      case "Care Activities Bundles":
        return <CareActivitiesBundle  title={formTitle} step={step} />;
      case "Occupation":
        return <Occupation  title={formTitle} step={step} />;
      case "Activities Gap":
        return <ActivitiesGap  title={formTitle} step={step} />;
      case "Suggestions":
        return <Suggestions  title={formTitle} step={step} />;
    }

  }
  return (
    <>
      <p className='sr-only'>
        {step <= step ? `Form step ${step} of ${step}` : 'Form Complete'}
      </p>
      {showStepContent()}
    </>
  );
};