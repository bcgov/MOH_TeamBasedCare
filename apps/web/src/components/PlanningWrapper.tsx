import { Stepper, Button, PlanningContent } from '@components';
import { PlanningSteps } from '../common/constants';
import { usePlanningContext } from '../services';
import { ExportButton } from './ExportButton';
import { PublishButton } from './PublishButton';
import { SessionNamePrompt } from './planning/SessionNamePrompt';

const WrapperContent = () => {
  const {
    state: { sessionId, currentStep },
    updateNextTriggered,
    updateCurrentStep,
  } = usePlanningContext();

  const isFirstStep = currentStep === 1;

  const handleNextStep = () => {
    updateNextTriggered();
  };
  const handlePreviousStep = () => {
    if (isFirstStep || currentStep < 1) return;
    updateCurrentStep(Number(currentStep) - 1);
  };

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
            <>
              <ExportButton sessionId={sessionId} />
              <PublishButton sessionId={sessionId} />
            </>
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

      {/* Outside PlanningContent so a stage change cannot unmount the prompt */}
      <SessionNamePrompt />
    </div>
  );
};

// PlanningProvider is hoisted to the page so the header can read the open draft's name
export const PlanningWrapper = () => {
  return <WrapperContent />;
};
