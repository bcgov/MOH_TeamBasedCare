import React, {useState} from 'react';
import { Stepper, Button, FormContent }  from '@components';

const stepTitles = ["Profile", "Care Activities Bundles", "Occupation", "Activities Gap"];

export const Form = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const isFirstStep = currentStep === 0;

  const handleNextStep = () => {
    if(currentStep > stepTitles.length) return;
    setCurrentStep(Number(currentStep) + 1);
  }
  const handlePreviousStep = () => {
    setCurrentStep(Number(currentStep) - 1);
  }
   
  return <>
     <div className='w-full flex items-center justify-between print:hidden rounded border-2 bg-white p-4 mt-10' aria-hidden>
        <div className="flex items-center space-x-2">
            <Stepper formSteps={stepTitles} step={currentStep} />
        </div>
        <div className="flex p-2"> 
            <Button variant="outline" type="button"  onClick={()=>{}}>Save Draft</Button>
            <Button variant="primary" type="button" disabled={isFirstStep}  onClick={handlePreviousStep}>Previous</Button>
            <Button variant="primary"  type="button" disabled={currentStep > stepTitles.length} onClick={handleNextStep}>Next</Button>
        </div>
    </div>
    <div className='w-full flex justify-right print:hidden border-2 bg-white  rounded p-4 mt-10' aria-hidden>
        <FormContent step={currentStep} formTitle={stepTitles[currentStep]}/>
    </div>
  </>;
};

