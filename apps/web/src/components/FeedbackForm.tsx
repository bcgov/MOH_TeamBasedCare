import { CreateFeedbackDto } from '@tbcm/common';
import { Formik, Form as FormikForm, FormikHelpers } from 'formik';
import { Button, Textarea } from '@components';
import { useFeedback } from 'src/services/useFeedback';
import { toast } from 'react-toastify';
import { dtoValidator } from '../utils/dto-validator';

interface FeedbackFormProps {
  setIsOpen: (value: React.SetStateAction<boolean>) => void;
}

export const FeedbackForm = ({ setIsOpen }: FeedbackFormProps) => {
  const initialValues = { text: '' };
  const { createFeedback, isLoading } = useFeedback();

  const handleSubmit = async (
    values: CreateFeedbackDto,
    { validateForm, setFieldValue }: FormikHelpers<CreateFeedbackDto>,
  ) => {
    /**
     * Bug: https://eydscanada.atlassian.net/browse/TBCM-182
     * Fix: createValidator method inside class-validator-formik does not support transformations.
     *   And since we are using common validators in BE & FE - handling it manually for FE
     */
    await setFieldValue('text', values.text?.trim());
    const errors = await validateForm();
    if (Object.keys(errors).length > 0) return;

    // post feedback to BE
    createFeedback(values, () => {
      setIsOpen(false);
      toast.info(`Your feedback recorded successfully. Thank you!`);
    });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validate={values => dtoValidator(CreateFeedbackDto, values)}
      validateOnBlur={false}
    >
      {({ isSubmitting }) => (
        <FormikForm>
          <p className='mb-5'>
            Should you encounter any issues while using the application, please enter feedback here.
          </p>

          <Textarea maxLength={750} name='text' label='' placeholder='Please enter feedback' />

          <div className='mt-5 flex flex-row-reverse gap-3'>
            <Button variant='primary' type='submit' disabled={isSubmitting} loading={isLoading}>
              Submit
            </Button>
            <Button variant='secondary' type='button' onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </FormikForm>
      )}
    </Formik>
  );
};
