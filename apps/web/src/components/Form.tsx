import React, {useEffect, useRef, useState} from 'react';
import { Stepper, Button, FormContent }  from '@components';

export const Form = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const isFirstStep = currentStep === 1;

  useEffect(()=> {
    
  }, [currentStep]);

  const steps = ["Profile", "Care Activities Bundles", "Occupation", "Activities Gap", "Suggestions"];

  const handleNextStep = () => {
    if(currentStep >= steps.length) return;
    setCurrentStep(Number(currentStep) + 1);
  }
  const handlePreviousStep = () => {
    if(isFirstStep || currentStep < 1) return;
    setCurrentStep(Number(currentStep) - 1);
  }
   
  return <>
     <div className='w-full flex items-center justify-between print:hidden rounded border-2 bg-white p-2 mt-4' aria-hidden>
        <div className="flex items-center space-x-2">
            <Stepper steps={steps} currentStep={currentStep} />
        </div>
        <div className="flex p-2"> 
            {/* <Button variant="outline" type="button" onClick={()=>{}}>Save Draft</Button> */}
            <Button variant="outline" type="button" classes={`ml-2 ${isFirstStep && "hidden"}`}  disabled={isFirstStep}  onClick={handlePreviousStep}>Previous</Button>
            <Button variant="primary"  type="button" classes={`ml-2 ${currentStep >= steps.length && "hidden"}`}  disabled={currentStep >= steps.length} onClick={handleNextStep}>Next</Button>
        </div>
    </div>
    <div className='w-full flex justify-right print:hidden border-2 bg-white  rounded p-4 mt-4' aria-hidden>
        <FormContent step={currentStep} formTitle={steps[currentStep -1]}/>
    </div>
  </>;
};

