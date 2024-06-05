import { useState } from 'react';
import { Button } from './Button';
import { PlanningOccupation, usePlanningContext, usePlanningOccupations } from '@services';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { AppMenu } from './generic/AppMenu';
import { OccupationSelector } from './OccupationSelector';
import { Form, Formik, FormikHelpers } from 'formik';
import { dtoValidator } from 'src/utils/dto-validator';
import { SaveOccupationDTO } from '@tbcm/common';
import { Error } from './Error';

// Component to view the occupation list in the gap-activity step
export const OccupationListDropdown = () => {
  const { handleSubmit, initialValues } = usePlanningOccupations({
    proceedToNextOnSubmit: false,
  });
  const { updateRefetchActivityGap } = usePlanningContext();

  const [showMenu, setShowMenu] = useState(false);

  const handleMenuToggle = () => {
    setShowMenu(prev => !prev);
  };

  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  const onSubmit = async (
    values: PlanningOccupation,
    actions: FormikHelpers<PlanningOccupation>,
  ) => {
    // validate and submit the occupation list
    // This after submission, also triggers refresh of the page by re-evaluating the activity gap data; supplied as param of usePlanningOccupations
    await handleSubmit(values);

    // formik update isSubmitting state
    actions.setSubmitting(false);

    // trigger refresh of the page by re-evaluating the activity gap data
    // this also triggers update to the selected occupations list
    updateRefetchActivityGap(true);

    // hide the dropdown menu
    handleCloseMenu();
  };

  const OccupationForm = ({
    values,
    isSubmitting,
  }: {
    values: PlanningOccupation;
    isSubmitting: boolean;
  }) => {
    return (
      <Form className='flex-1 flex flex-col'>
        <div className='max-h-56 overflow-auto'>
          <OccupationSelector />
        </div>

        <hr className='my-4' />
        <Button variant='primary' type='submit' classes={`m-2`} disabled={isSubmitting}>
          Confirm ({values?.occupation?.length})
        </Button>
      </Form>
    );
  };

  return (
    <div className='relative'>
      <div className='flex'>
        <Button
          variant='secondary'
          type='button'
          classes={`ml-2`}
          onClick={() => handleMenuToggle()}
        >
          Occupation List
          <FontAwesomeIcon title='Close' icon={faEdit} className='h-4 ml-2 mr-1' />
        </Button>
      </div>
      {showMenu && (
        <AppMenu size='lg' handleMenuHide={handleCloseMenu}>
          <Formik
            initialValues={initialValues}
            validate={values => dtoValidator(SaveOccupationDTO, values)}
            onSubmit={onSubmit}
            validateOnBlur={true}
            enableReinitialize={true}
          >
            {({ values, isSubmitting }) => (
              <div className='flex-1 flex flex-col min-h-0 p-2'>
                <Error name='occupation'></Error>
                <OccupationForm values={values} isSubmitting={isSubmitting} />
              </div>
            )}
          </Formik>
        </AppMenu>
      )}
    </div>
  );
};
