import { useState, useEffect } from 'react';
import { Stepper, Button, PlanningContent } from '@components';
import { PlanningSteps } from '../common/constants';
import { PlanningProvider } from './planning/PlanningContext';
import { usePlanningSession } from '../services/usePlanningSession';
import { usePlanningContext } from '../services';
import { ExportButton } from './ExportButton';
import { Modal } from './generic/Modal';

const WrapperContent = () => {
  const { sessionId } = usePlanningSession();

  const {
    state: { canProceedToNext, canProceedToPrevious },
    updateNextTriggered,
    updateSessionId,
    updateShowModal,
    updateCanProceedToPrevious,
  } = usePlanningContext();

  const [currentStep, setCurrentStep] = useState(1);
  const isFirstStep = currentStep === 1;

  const handleNextStep = () => {
    updateNextTriggered();
  };
  const handlePreviousStep = async () => {
    if (isFirstStep || currentStep < 1) return;
    updateShowModal(true);
  };

  useEffect(() => {
    if (canProceedToPrevious) {
      setCurrentStep(Number(currentStep) - 1);
      updateCanProceedToPrevious(false);
    }
  }, [canProceedToPrevious]);

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
    <div className='flex-1 flex flex-col min-h-0'>
      <div
        className='w-full flex items-center justify-between print:hidden rounded border-2 bg-white p-1 mt-4'
        aria-hidden
      >
        <div className='flex items-center space-x-2'>
          <Stepper steps={PlanningSteps} currentStep={currentStep} />
        </div>
        <div className='flex p-2'>
          <Modal
            headerTitle='Unsaved changes'
            bodyText='If you are leaving this step now, all of the information you entered here will be unsaved. Are you sure you want to leave now?'
          />

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
      <div className='flex-1 flex flex-col min-h-0'>
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
