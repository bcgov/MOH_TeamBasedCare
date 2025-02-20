import React from 'react';
import { faGreaterThan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface CheckProps {
  step: number;
  currentStep: number;
}

const Check: React.FC<CheckProps> = ({ step, currentStep }) => {
  return (
    <div
      className={`
      h-6 w-6 rounded-full border-2 
      flex flex-row items-center justify-center
      ${
        currentStep == step
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
  step: number;
  label: string;
  currentStep: number;
}

const Step: React.FC<StepProps> = ({ step, label, currentStep }) => {
  return (
    <div
      className={`flex flex-col items-start transition ease-in-out ${
        currentStep == step ? 'scale-105 px-1' : ''
      }`}
    >
      <div aria-hidden className='flex justify-center items-center'>
        <Check step={step} currentStep={currentStep} />
        <label
          className={`hidden ml-2 text-base w-min font-bold whitespace-nowrap ${
            currentStep == step ? 'text-bcBluePrimary !block' : 'text-gray-400 xl:block'
          } `}
        >
          {label}
        </label>
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
      <div className='flex items-center space-x-2'>
        {steps
          ?.filter(v => !!v)
          .map((step, index) => (
            <React.Fragment key={step}>
              <Step currentStep={currentStep} label={step} step={index + 1} />
              {stepCount !== index + 1 ? (
                <FontAwesomeIcon icon={faGreaterThan} className={`h-3 text-gray-400 px-1`} />
              ) : null}
            </React.Fragment>
          ))}
      </div>
    </>
  );
};
