import { PlanningStepHeader } from '@components';
import { useEffect } from 'react';
import { usePlanningContext } from '../../services';

export interface CareActivitiesBundleProps {
  step: number;
  title: string;
}

export const CareActivitiesBundle: React.FC<CareActivitiesBundleProps> = ({ title }) => {
  const {
    state: { isNextTriggered },
    updateProceedToNext,
  } = usePlanningContext();

  useEffect(() => {
    if (isNextTriggered) {
      updateProceedToNext();
    }
  }, [isNextTriggered]);

  return (
    <div className='planning-form-box'>
      <PlanningStepHeader>{title}</PlanningStepHeader>
    </div>
  );
};
