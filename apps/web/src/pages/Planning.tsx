import React, {useEffect, useRef, useState} from 'react';
import { Stepper, Button, FormContent }  from '@components';
import { Formik,Form} from 'formik';
import { steps } from '../common/constants';

interface PlanningFormValues {
  firstName: string;
  lastName: string;
}

export const Planning = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const isFirstStep = currentStep === 1;

  const initialValues: PlanningFormValues = { 
    firstName: "Bob",
    lastName: "Loblaw",
  };

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
            <Button variant="outline" type="button" classes={`ml-2 ${isFirstStep && "hidden"}`}  disabled={isFirstStep}  onClick={handlePreviousStep}>Previous</Button>
            <Button variant="primary"  type="button" classes={`ml-2 ${currentStep >= steps.length && "hidden"}`}  disabled={currentStep >= steps.length} onClick={handleNextStep}>Next</Button>
        </div>
    </div>
    <div className='w-full flex justify-right print:hidden border-2 bg-white  rounded p-4 mt-4' aria-hidden>
      <Formik
          initialValues={initialValues}
          onSubmit={(values, actions) => {
            console.log({ values, actions });
            alert(JSON.stringify(values, null, 2));
            actions.setSubmitting(false);
          }}
        >
           <Form>
              <FormContent step={currentStep} formTitle={steps[currentStep -1]}/>

              {/* <Button variant="outline" type="submit" classes="mt-5" onClick={()=>{}}>Save Draft</Button> */}
          </Form>
      </Formik>
    </div>
  </>;
};

