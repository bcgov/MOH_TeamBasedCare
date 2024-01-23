import { useState, useEffect } from 'react';
import { Stepper, Button, PlanningContent } from '@components';
import { PlanningSteps } from '../common/constants';
import { PlanningProvider } from './planning/PlanningContext';
import { usePlanningContext } from '../services';
import { ExportButton } from './ExportButton';

const WrapperContent = () => {
  const {
    state: { canProceedToNext, sessionId },
    updateNextTriggered,
  } = usePlanningContext();

  const [currentStep, setCurrentStep] = useState(1);
  const isFirstStep = currentStep === 1;

  const handleNextStep = () => {
    updateNextTriggered();
  };
  const handlePreviousStep = () => {
    if (isFirstStep || currentStep < 1) return;
    setCurrentStep(Number(currentStep) - 1);
  };

  useEffect(() => {
    if (canProceedToNext) {
      if (currentStep >= PlanningSteps.length) return;
      setCurrentStep(Number(currentStep) + 1);
    }
  }, [canProceedToNext]);

  return (
    <div className='flex-1 flex flex-col min-h-0'>
      <div
        className='w-full overflow-x-auto flex items-center justify-between print:hidden rounded border-2 bg-white p-1 mt-4'
        aria-hidden
      >
        <div className='flex items-center space-x-2'>
          <Stepper steps={PlanningSteps} currentStep={currentStep} />
        </div>
        <div className='flex p-2'>
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
      <div className='flex-1 flex flex-col min-h-0 overflow-y-auto'>
        <PlanningContent step={currentStep} formTitle={PlanningSteps[currentStep - 1]} />
      </div>
    </div>
  );
};

export const PlanningWrapper = () => {
  return (
    <PlanningProvider>
      <WrapperContent />
    </PlanningProvider>
  );
};
