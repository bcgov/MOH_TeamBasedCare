import { PageTitle } from '@components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { LeftSideBarActivites, RightSideBarActivites } from '@components';
import { Formik, Form } from 'formik';
import { usePlanningContent } from '../../services';
import { Error } from '../Error';
import { SaveCareActivityDTO } from '@tbcm/common';
import createValidator from 'class-validator-formik';
import { usePlanningCareActivities } from '../../services';

export interface CareActivitiesBundleProps {
  step?: number;
  title: string;
}

const CareActivitiesBundleWrapper: React.FC<CareActivitiesBundleProps> = ({ title }) => {
  usePlanningContent();

  return (
    <Form>
      <Error name='careActivityBundle'></Error>
      <div className='flex'>
        <LeftSideBarActivites title={title} />
        <RightSideBarActivites />
      </div>
    </Form>
  );
};

export const CareActivitiesBundle: React.FC<CareActivitiesBundleProps> = ({ title }) => {
  const { handleSubmit, initialValues } = usePlanningCareActivities();

  const occupationValidationSchema = createValidator(SaveCareActivityDTO);

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
          onSubmit={handleSubmit}
          validate={occupationValidationSchema}
          validateOnBlur={true}
          enableReinitialize={true}
        >
          <CareActivitiesBundleWrapper title={title} />
        </Formik>
      </div>
    </>
  );
};
