import { FormStepHeader }  from '@components';


interface StepProps {
//   index: number;
  step: number;
  formTitle: string;
//   label: string;
//   isLast: boolean;
//   currenStep: number;StepProps
}

export const FormContent: React.FC<StepProps> = ({step, formTitle}) => {
  const stepCount = step;
  return (
    <>
      <p className='sr-only'>
        {step <= stepCount ? `Form step ${step} of ${stepCount}` : 'Form Complete'}
      </p>
     
    <FormStepHeader>{formTitle}</FormStepHeader>
    </>
  );
};