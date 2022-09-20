import { PageTitle } from '@components';
import { planningFormBox } from '../../styles/styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { LeftSideBarActivites, RightSideBarActivites } from '@components';
import { Formik } from 'formik';

export interface CareActivitiesBundleProps {
  step: number;
  title: string;
}
export const initialValues = {
  careActivities: [],
  careActivityBundle: [],
};

export const CareActivitiesBundle: React.FC<CareActivitiesBundleProps> = ({ title }) => {
  //const { handleSubmit, initialValues } = usePlanningProfile();
  // const { handleSubmit } = usePlanningProfile();

  const handleCareActivitiesForm = function () {
    // any clear comments.
  };
  const description =
    'Based on the your Profile selection, here are the list of activities that done by the selected care location profile. All the care acitivities are selected by default, please select or deselect base on your planning.';

  return (
    <>
      <div className={planningFormBox}>
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
            <>
              <LeftSideBarActivites title={title} />
              <RightSideBarActivites />
            </>
          </Formik>
        </div>
      </div>
    </>
  );
};
