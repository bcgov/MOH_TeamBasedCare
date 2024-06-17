import { PageTitle } from '@components';
import { LeftSideBarActivites, RightSideBarActivites } from '@components';
import { Formik, Form } from 'formik';

import { usePlanningContent, usePlanningContext } from '../../services';
import { Error } from '../Error';
import { SaveCareActivityDTO } from '@tbcm/common';
import { dtoValidator } from '../../utils/dto-validator';
import { usePlanningCareActivities } from '../../services';
import { usePlanningProfile } from 'src/services/usePlanningProfile';
import { useEffect } from 'react';
import { Spinner } from '../generic/Spinner';
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
  const { updateSessionId } = usePlanningContext();
  const { handleSubmit, initialValues } = usePlanningCareActivities();
  const { lastDraft, isLoading } = usePlanningProfile();

  useEffect(() => {
    if (!lastDraft?.id) return;
    updateSessionId(lastDraft.id);
  }, [lastDraft?.id]);

  const description =
    'Based on the care setting selected, these are the associated care activity bundles. Please select or deselect based on your needs.';
  return (
    <>
      <div className='planning-form-box'>
        <PageTitle description={description} />
        {isLoading ? (
          <Spinner show={isLoading} />
        ) : (
          <Formik
            initialValues={initialValues}
            onSubmit={handleSubmit}
            validate={values => dtoValidator(SaveCareActivityDTO, values)}
            validateOnBlur={true}
            enableReinitialize={true}
          >
            <CareActivitiesBundleWrapper title={title} />
          </Formik>
        )}
      </div>
    </>
  );
};
