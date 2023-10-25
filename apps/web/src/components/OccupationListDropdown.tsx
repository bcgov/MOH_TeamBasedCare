import { useState } from 'react';
import { Button } from './Button';
import { usePlanningContext, usePlanningOccupations } from '@services';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { AppMenu, HIDE_MENU_DELAY } from './generic/AppMenu';
import { OccupationSelector } from './OccupationSelector';
import { Form, Formik } from 'formik';
import createValidator from 'class-validator-formik';
import { SaveOccupationDTO } from '@tbcm/common';
import { Error } from './Error';

// Component to view the occupation list in the gap-activity step
export const OccupationListDropdown = () => {
  const { handleSubmit, initialValues, updateOccupationsForSessionId } = usePlanningOccupations({
    proceedToNextOnSubmit: false,
  });
  const occupationValidationSchema = createValidator(SaveOccupationDTO);
  const { updateRefetchActivityGap } = usePlanningContext();

  const [showMenu, setShowMenu] = useState(false);

  const hideMenu = () => {
    setTimeout(() => setShowMenu(false), HIDE_MENU_DELAY);
  };

  const onSubmit = async (values: any, actions: any) => {
    // validate and submit the occupation list
    // This after submission, also triggers refresh of the page by re-evaluating the activity gap data; supplied as param of usePlanningOccupations
    await handleSubmit(values);

    // formik update isSubmitting state
    actions.setSubmitting(false);

    // update selected occupations list
    updateOccupationsForSessionId();

    // trigger refresh of the page by re-evaluating the activity gap data
    updateRefetchActivityGap(true);

    // hide the dropdown menu
    hideMenu();
  };

  const OccupationForm = ({ values, isSubmitting }: { values: any; isSubmitting: boolean }) => {
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
          onClick={() => setShowMenu(!showMenu)}
        >
          Occupation List
          <FontAwesomeIcon title='Close' icon={faEdit} className='h-4 ml-2 mr-1' />
        </Button>
      </div>
      {showMenu && (
        <AppMenu size='lg'>
          <Formik
            initialValues={initialValues}
            validate={occupationValidationSchema}
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
