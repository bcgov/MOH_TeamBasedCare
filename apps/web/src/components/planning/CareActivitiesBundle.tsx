import { PageTitle } from '@components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile } from '@fortawesome/free-solid-svg-icons';
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
    <Form className='flex flex-1 flex-col min-h-0'>
      <Error name='careActivityBundle'></Error>
      <div className='flex-1 flex min-h-0'>
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
    'Based on the care setting selected, these are the associated care activity bundles. All the care activities are selected by default, please select or deselect based on your needs.';

  return (
    <>
      <div className='planning-form-box'>
        <PageTitle title={title} description={description}>
          <FontAwesomeIcon icon={faFile} className='h-6 text-bcBluePrimary' />
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
