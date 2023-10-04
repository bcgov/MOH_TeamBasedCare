import { Profile } from './planning/Profile';
import { CareActivitiesBundle } from './planning/CareActivitiesBundle';
import { Occupation } from './planning/Occupation';
import { ActivitiesGap } from './planning/ActivitiesGap';
import { Suggestions } from './planning/Suggestions';

interface PlanningContentProps {
  step: number;
  formTitle: string;
}

export const PlanningContent: React.FC<PlanningContentProps> = ({ step, formTitle }) => {
  const showStepContent = () => {
    switch (formTitle) {
      case 'Profile':
        return <Profile title={formTitle} step={step} />;
      case 'Care Activity Bundles':
        return <CareActivitiesBundle title={formTitle} step={step} />;
      case 'Occupations/Roles':
        return <Occupation title={formTitle} step={step} />;
      case 'Gaps, Optimizations and Suggestions':
        return <ActivitiesGap title={formTitle} step={step} />;
      case 'Suggestions':
        return <Suggestions title={formTitle} step={step} />;
    }
  };
  return (
    <div className='flex-1 flex flex-col min-h-0'>
      <p className='flex-none sr-only'>
        {step <= step ? `Form step ${step} of ${step}` : 'Form Complete'}
      </p>
      {showStepContent()}
    </div>
  );
};
