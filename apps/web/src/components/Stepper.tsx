import { faCheck, faGreaterThan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface CheckProps {
  number: number;
  step: number;
  currentStep: number;
}

const Check: React.FC<CheckProps> = ({ number, step, currentStep }) => {
  return (
    <div
      className={`
      h-6 w-6 rounded-full border-2 
      flex flex-row items-center justify-center mr-4
      ${step >= number && 'bg-bcBlueNav '}  
      ${currentStep >= number && ' border-bcDarkBlue bg-bcDarkBlue text-white'}  
      `}
    >
      {(() => {
        switch (true) {
          case currentStep === step:
            return <span className='text-sm'>{step}</span>;
          case currentStep < step:
            return <span className='text-sm'>{step}</span>;
          default:
            return <FontAwesomeIcon icon={faCheck} className='h-3' />;
        }
      })()}
    </div>
  );
};

interface StepProps {
  index: number;
  step: number;
  label: string;
  isLast: boolean;
  currentStep: number;
}

const Step: React.FC<StepProps> = ({ index, step, label, isLast, currentStep }) => {
  return (
    <div className='flex flex-col items-start'>
      <div aria-hidden className='flex justify-center items-center text-slate-400'>
        <Check number={index + 1} step={step} currentStep={currentStep}/>
        <label className='hidden md:block text-lg w-min text-slate-400 whitespace-nowrap mr-4'>{label}</label>
        {!isLast ? (
          <FontAwesomeIcon icon={faGreaterThan} className='h-3 mr-4' />
        ) : null} 
      </div>
      
    </div>
  );
};

export const Stepper: React.FC<{ steps: string[]; currentStep: number }> = ({ steps, currentStep }) => {
  const stepCount = steps.length;
  return (
    <>
      <p className='sr-only'>
        {currentStep <= stepCount ? `Form step ${currentStep} of ${stepCount}` : 'Form Complete'}
      </p>
     
        {steps.map((step, index) => (
          <Step
            key={index}
            index={index}
            currentStep={currentStep}
            label={step}
            isLast={stepCount === index + 1}
            step={index + 1}
          />
        ))}
     
      
    </>
  );
};