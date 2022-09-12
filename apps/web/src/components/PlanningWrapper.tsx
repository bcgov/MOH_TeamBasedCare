import React, { useState } from 'react';
import { Stepper, Button, PlanningContent } from '@components';
import { Formik, Form } from 'formik';
import { PlanningSteps } from '../common/constants';

interface PlanningWrapperFormValues {
  firstName: string;
  lastName: string;
}

export const PlanningWrapper = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const isFirstStep = currentStep === 1;

  const initialValues: PlanningWrapperFormValues = {
    firstName: 'Bob',
    lastName: 'Loblaw',
  };

  const handleNextStep = () => {
    if (currentStep >= PlanningSteps.length) return;
    setCurrentStep(Number(currentStep) + 1);
  };
  const handlePreviousStep = () => {
    if (isFirstStep || currentStep < 1) return;
    setCurrentStep(Number(currentStep) - 1);
  };

  return (
    <>
      <div
        className='w-full flex items-center justify-between print:hidden rounded border-2 bg-white p-2 mt-4'
        aria-hidden
      >
        <div className='flex items-center space-x-2'>
          <Stepper steps={PlanningSteps} currentStep={currentStep} />
        </div>
        <div className='flex p-2'>
          <Button
            variant='outline'
            type='button'
            classes={`ml-2 ${isFirstStep && 'hidden'}`}
            disabled={isFirstStep}
            onClick={handlePreviousStep}
          >
            Previous
          </Button>
          <Button
            variant='primary'
            type='button'
            classes={`ml-2 ${currentStep >= PlanningSteps.length && 'hidden'}`}
            disabled={currentStep >= PlanningSteps.length}
            onClick={handleNextStep}
          >
            Next
          </Button>
        </div>
      </div>
      <div
        className='w-full flex justify-right print:hidden border-2 bg-white  rounded p-4 mt-4'
        aria-hidden
      >
        <Formik
          initialValues={initialValues}
          onSubmit={(values, actions) => {
            alert(JSON.stringify(values, null, 2));
            actions.setSubmitting(false);
          }}
        >
          <Form className='w-full'>
            <PlanningContent step={currentStep} formTitle={PlanningSteps[currentStep - 1]} />

            {/* <Button variant="outline" type="submit" classes="mt-5" onClick={()=>{}}>Save Draft</Button> */}
          </Form>
        </Formik>
      </div>
    </>
  );
};
