import { useFormikContext } from 'formik';
import { useEffect } from 'react';
import { usePlanningContext } from './usePlanningContext';

export const usePlanningContent = () => {
  const { isSubmitting, submitForm, setSubmitting } = useFormikContext();
  const {
    state: { isNextTriggered },
    updateWaitForValidation,
  } = usePlanningContext();

  useEffect(() => {
    (async () => {
      if (isNextTriggered && !isSubmitting) {
        await submitForm();
        updateWaitForValidation();
        setSubmitting(false);
      }
    })();
  }, [isNextTriggered]);
};
