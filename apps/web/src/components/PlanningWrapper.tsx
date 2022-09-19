/* eslint-disable @typescript-eslint/no-empty-function */

import React, { useState } from 'react';
import { Stepper, Button, PlanningContent } from '@components';
import { Formik, Form } from 'formik';
import { PlanningSteps } from '../common/constants';
// import { usePlanningSession } from '../services/usePlanningSession';

interface PlanningWrapperFormValues {
  firstName: string;
  lastName: string;
  careActivityID: string;
  careActivityBundle: [];
  checked: [];
}

export const PlanningWrapper = () => {
  // const { planningSession } = usePlanningSession();

  const [currentStep, setCurrentStep] = useState(1);
  const isFirstStep = currentStep === 1;

  const initialValues: PlanningWrapperFormValues = {
    firstName: 'Bob',
    lastName: 'Loblaw',
    careActivityID: '3dd33805-a813-4cab-8576-e06355f16074',
    careActivityBundle: [],
    checked: [],
  };

  const handleNextStep = () => {
    if (currentStep >= PlanningSteps.length) return;
    setCurrentStep(Number(currentStep) + 1);
  };
  const handlePreviousStep = () => {
    if (isFirstStep || currentStep < 1) return;
    setCurrentStep(Number(currentStep) - 1);
  };

  const handleForm = () => {
   
  }

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
        <Formik initialValues={initialValues} onSubmit={handleForm}>
          <Form className='w-full'>
            <PlanningContent step={currentStep} formTitle={PlanningSteps[currentStep - 1]} />
            {/* <Button variant="outline" type="submit" classes="mt-5" onClick={()=>{}}>Save Draft</Button> */}
          </Form>
        </Formik>
      </div>
    </>
  );
};
