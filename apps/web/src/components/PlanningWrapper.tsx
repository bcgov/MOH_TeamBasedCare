import { useState, useEffect } from 'react';
import { Stepper, Button, PlanningContent } from '@components';
import { PlanningSteps } from '../common/constants';
import { planningPath } from '../common/constants';
import { PlanningProvider } from './planning/PlanningContext';
import { usePlanningContext } from '../services';
import { ExportButton } from './ExportButton';
import { useAppContext } from './AppContext';

type WrapperProps = {
  initialStep: number;
};

const WrapperContent: React.FC<WrapperProps> = ({ initialStep }) => {
  const {
    state: { canProceedToNext, sessionId },
    updateNextTriggered,
  } = usePlanningContext();
  const { updateActivePath } = useAppContext();

  const [currentStep, setCurrentStep] = useState(initialStep);
  const isFirstStep = currentStep === 1;

  useEffect(() => {
    setCurrentStep(initialStep);
  }, [initialStep]);

  const handleNextStep = () => {
    updateNextTriggered();
  };

  const handlePreviousStep = () => {
    if (isFirstStep || currentStep < 1) return;
    setCurrentStep(Number(currentStep) - 1);
    updateActivePath(planningPath[Number(currentStep) - 1]);
  };

  useEffect(() => {
    if (canProceedToNext) {
      if (currentStep >= PlanningSteps.length) return;
      setCurrentStep(Number(currentStep) + 1);
      updateActivePath(planningPath[Number(currentStep) + 1]);
    }
  }, [canProceedToNext]);

  return (
    <div className='flex-1 flex flex-col min-h-0'>
      <div
        className='w-full overflow-x-auto flex items-center justify-between print:hidden rounded border-2 bg-white p-4 mt-4'
        aria-hidden
      >
        <Stepper steps={PlanningSteps} currentStep={currentStep} />
        <div className='flex'>
          <Button
            variant='outline'
            type='button'
            classes={`ml-2`}
            disabled={isFirstStep}
            onClick={handlePreviousStep}
          >
            Previous
          </Button>

          {currentStep >= PlanningSteps.length ? (
            <ExportButton sessionId={sessionId}></ExportButton>
          ) : (
            <Button
              variant='primary'
              type='button'
              classes={`ml-2`}
              disabled={currentStep >= PlanningSteps.length}
              onClick={handleNextStep}
            >
              Next
            </Button>
          )}
        </div>
      </div>
      {/* Works here */}
      <div className='flex-1 flex flex-col min-h-0 overflow-y-auto mt-4'>
        <PlanningContent step={currentStep} formTitle={PlanningSteps[currentStep - 1]} />
      </div>
    </div>
  );
};

export const PlanningWrapper: React.FC<WrapperProps> = ({ initialStep }) => {
  return (
    <PlanningProvider>
      <WrapperContent initialStep={initialStep} />
    </PlanningProvider>
  );
};
