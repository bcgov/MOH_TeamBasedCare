import { faGreaterThan } from '@fortawesome/free-solid-svg-icons';
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
      flex flex-row items-center justify-center mr-2
      ${
        currentStep == number
          ? ' border-bcBluePrimary bg-bcBluePrimary text-white'
          : 'border-gray-400 text-gray-400'
      }  
      `}
    >
      <span className='text-sm'>{step}</span>
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
      <div aria-hidden className='flex justify-center items-center'>
        <Check number={index + 1} step={step} currentStep={currentStep} />
        <label
          className={`hidden text-base w-min font-bold whitespace-nowrap ${
            currentStep == index + 1 ? 'text-bcBluePrimary lg:block' : 'text-gray-400 xl:block'
          } `}
        >
          {label}
        </label>
        {!isLast ? (
          <FontAwesomeIcon
            icon={faGreaterThan}
            className={`h-3 text-gray-400 mx-2 ${currentStep == index + 1 ? '' : ''}`}
          />
        ) : null}
      </div>
    </div>
  );
};

export const Stepper: React.FC<{ steps: string[]; currentStep: number }> = ({
  steps,
  currentStep,
}) => {
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
