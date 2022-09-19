import { useState, useEffect } from 'react';
import { Stepper, Button, PlanningContent } from '@components';
import { PlanningSteps } from '../common/constants';
import { PlanningProvider } from './planning/PlanningContext';
import { usePlanningSession } from '../services/usePlanningSession';
import { usePlanningContext } from '../services';

interface PlanningWrapperFormValues {
  firstName: string;
  lastName: string;
  careActivityID: string;
  careActivityBundle: [];
  checked: [];
}

const WrapperContent = () => {
  const { sessionId } = usePlanningSession();

  const {
    state: { canProceedToNext },
    updateNextTriggered,
    updateSessionId,
  } = usePlanningContext();

  const [currentStep, setCurrentStep] = useState(1);
  const isFirstStep = currentStep === 1;

  const initialValues: PlanningWrapperFormValues = {
    firstName: 'Bob',
    lastName: 'Loblaw',
    careActivityID: '',
    careActivityBundle: [],
    checked: [],
  };

  const handleNextStep = () => {
    updateNextTriggered();
  };
  const handlePreviousStep = () => {
    if (isFirstStep || currentStep < 1) return;
    setCurrentStep(Number(currentStep) - 1);
  };

  useEffect(() => {
    if (sessionId) {
      updateSessionId(sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    if (canProceedToNext) {
      if (currentStep >= PlanningSteps.length) return;
      setCurrentStep(Number(currentStep) + 1);
    }
  }, [canProceedToNext]);

  return (
    <>
      <div
        className='w-full flex items-center justify-between print:hidden rounded border-2 bg-white p-1 mt-4'
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
          <Button
            variant='primary'
            type='button'
            classes={`ml-2`}
            disabled={currentStep >= PlanningSteps.length}
            onClick={handleNextStep}
          >
            Next
          </Button>
        </div>
      </div>
      <div className='' aria-hidden>
        <PlanningContent step={currentStep} formTitle={PlanningSteps[currentStep - 1]} />
      </div>
    </>
  );
};

export const PlanningWrapper = () => {
  return (
    <PlanningProvider>
      <WrapperContent />
    </PlanningProvider>
  );
};
