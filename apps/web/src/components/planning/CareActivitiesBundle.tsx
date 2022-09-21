import { PageTitle } from '@components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { LeftSideBarActivites, RightSideBarActivites } from '@components';
import { Form, Formik, useFormikContext } from 'formik';
import { usePlanningContext } from '@services';
import { useEffect } from 'react';

export interface CareActivitiesBundleProps {
  step: number;
  title: string;
}
export const initialValues = {
  careActivities: [],
  careActivityBundle: [],
};

const CareActivityBundleForm: React.FC = ({ children }) => {
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

  return <Form>{children}</Form>;
};

export const CareActivitiesBundle: React.FC<CareActivitiesBundleProps> = ({ title }) => {
  //const { handleSubmit, initialValues } = usePlanningProfile();
  // const { handleSubmit } = usePlanningProfile();
  const { updateProceedToNext } = usePlanningContext();

  const handleCareActivitiesForm = function () {
    // any clear comments.
    updateProceedToNext();
  };
  const description =
    'Based on the your Profile selection, here are the list of activities that done by the selected care location profile. All the care acitivities are selected by default, please select or deselect base on your planning.';

  return (
    <>
      <div className='planning-form-box'>
        <PageTitle title={title} description={description}>
          <FontAwesomeIcon icon={faClipboardList} className='h-8 text-bcBluePrimary' />
        </PageTitle>

        <div className='flex'>
          <Formik
            initialValues={initialValues}
            onSubmit={handleCareActivitiesForm}
            validateOnBlur={true}
            validateOnMount={true}
            enableReinitialize={true}
          >
            <CareActivityBundleForm>
              <div className='flex'>
                <LeftSideBarActivites title={title} />
                <RightSideBarActivites />
              </div>
            </CareActivityBundleForm>
          </Formik>
        </div>
      </div>
    </>
  );
};
