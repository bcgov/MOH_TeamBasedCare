import { CreateFeedbackDto } from '@tbcm/common';
import createValidator from 'class-validator-formik';
import { Formik, Form as FormikForm } from 'formik';
import { Button, Textarea } from '@components';
import { useFeedback } from 'src/services/useFeedback';
import { Spinner } from './generic/Spinner';
import { toast } from 'react-toastify';

interface FeedbackFormProps {
  setIsOpen: (value: React.SetStateAction<boolean>) => void;
}

export const FeedbackForm = ({ setIsOpen }: FeedbackFormProps) => {
  const initialValues = { text: '' };
  const { createFeedback, isLoading } = useFeedback();

  const handleSubmit = async (values: CreateFeedbackDto) => {
    createFeedback(values, () => {
      setIsOpen(false);
      toast.info(`Your feedback recorded successfully. Thank you!`);
    });
  };

  const feedbackSchema = createValidator(CreateFeedbackDto);

  if (isLoading) {
    return <Spinner show />;
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validate={feedbackSchema}
      validateOnBlur={false}
    >
      {({ isSubmitting }) => (
        <FormikForm>
          <p className='mb-5'>
            Should you encounter any issues while using the application, please enter feedback here.
          </p>

          <Textarea maxLength={750} name='text' label='' placeholder='Please enter feedback' />

          <div className='mt-5 flex flex-row-reverse gap-3'>
            <Button variant='primary' type='submit' disabled={isSubmitting}>
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
