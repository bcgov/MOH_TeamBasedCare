import { PageTitle } from '@components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { LeftSideBarActivites, RightSideBarActivites } from '@components';
import { Formik, Form } from 'formik';
import { useFormikContext } from 'formik';
import { usePlanningContext } from '@services';
import { useEffect } from 'react';

export interface CareActivitiesBundleProps {
  step?: number;
  title: string;
}
export const initialValues = {
  careActivities: [],
  careActivityBundle: [],
};

const CareActivitiesForm: React.FC<CareActivitiesBundleProps> = ({ title }) => {
  const { isSubmitting, submitForm, isValid } = useFormikContext();

  const {
    state: { isNextTriggered },
    updateWaitForValidation,
  } = usePlanningContext();

  useEffect(() => {
    (async () => {
      if (isNextTriggered && !isSubmitting) {
        try {
          await submitForm();
          !isValid && updateWaitForValidation();
        } catch (error: any) {
          updateWaitForValidation();
        }
      }
    })();
  }, [isNextTriggered]);

  return (
    <Form>
      <div className='flex'>
        <LeftSideBarActivites title={title} />
        <RightSideBarActivites />
      </div>
    </Form>
  );
};

export const CareActivitiesBundle: React.FC<CareActivitiesBundleProps> = ({ title }) => {
  const { updateProceedToNext } = usePlanningContext();

  const description =
    'Based on the your Profile selection, here are the list of activities that done by the selected care location profile. All the care acitivities are selected by default, please select or deselect base on your planning.';

  return (
    <>
      <div className='planning-form-box'>
        <PageTitle title={title} description={description}>
          <FontAwesomeIcon icon={faClipboardList} className='h-8 text-bcBluePrimary' />
        </PageTitle>

        <Formik
          initialValues={initialValues}
          onSubmit={() => {
            updateProceedToNext();
          }}
          validateOnBlur={true}
          validateOnMount={true}
          enableReinitialize={true}
        >
          <CareActivitiesForm title={title} />
        </Formik>
      </div>
    </>
  );
};
