/* eslint-disable @typescript-eslint/no-explicit-any */
import { Radio, Checkbox } from '@components';
import { Form, Formik, useFormikContext } from 'formik';
import { useCareLocations, usePlanningContent, usePlanningContext, useMe } from '../../services';
import {
  PlanningSessionRO,
  ProfileOptions,
  SaveProfileDTO,
  formatDateFromNow,
  formatDateTime,
} from '@tbcm/common';
import { dtoValidator } from '../../utils/dto-validator';
import { RenderSelect } from '../generic/RenderSelect';
import { usePlanningProfile } from '../../services/usePlanningProfile';
import { ModalWrapper } from '../Modal';
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { Spinner } from '../generic/Spinner';

export interface ProfileProps {
  step: number;
  title: string;
}

interface ProfileFormProps {
  profileOption: string;
  careLocation: string;
  userPrefNotShowConfirmDraftRemoval?: boolean;
}

const ProfileForm = ({
  lastDraft,
  isLoading: isLoadingPlanningProfile,
}: {
  lastDraft?: PlanningSessionRO;
  isLoading: boolean;
}) => {
  const { values, initialValues, setValues } = useFormikContext<ProfileFormProps>();
  const { careLocations, isValidating: isLoadingCareLocations } = useCareLocations();
  const [showModal, setShowModal] = useState(false);
  const { updateSessionId } = usePlanningContext();
  const [lastDraftUpdatedFromNow, setLastDraftUpdatedFromNow] = useState('');

  const handleLastDraft = useCallback(() => {
    if (!lastDraft) return;

    updateSessionId(lastDraft.id);

    setValues({
      profileOption: ProfileOptions.DRAFT,
      careLocation: lastDraft.careSetting.id,
    });
  }, [lastDraft]);

  const handleScratch = useCallback(() => {
    updateSessionId(); // reset session id

    // reset care location to default value
    setValues({
      profileOption: ProfileOptions.FROM_SCRATCH,
      careLocation: '',
    });
  }, []);

  // handle Loading state
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    setIsLoading(isLoadingPlanningProfile || isLoadingCareLocations);
  }, [isLoadingCareLocations, isLoadingPlanningProfile]);

  // handle profileOption change
  useEffect(() => {
    switch (values.profileOption) {
      case ProfileOptions.FROM_SCRATCH:
        return handleScratch();
      case ProfileOptions.DRAFT:
        return handleLastDraft();
      default:
        return handleLastDraft();
    }
  }, [values.profileOption, lastDraft]);

  usePlanningContent();

  useEffect(() => {
    if (values?.careLocation && initialValues?.careLocation) {
      // if previous care location exists, but the value is not same as initial - show modal
      if (values.careLocation !== initialValues.careLocation) {
        setShowModal(true);
      }
    }
  }, [initialValues.careLocation, values.careLocation]);

  useEffect(() => {
    if (!lastDraft?.updatedAt) return;

    const updatedAt = lastDraft.updatedAt;

    const interval = () => {
      setLastDraftUpdatedFromNow(formatDateFromNow(updatedAt) || '');
    };

    interval(); // run immediately
    const intervalId = setInterval(interval, 10000); // re-evaluate every 10s

    return () => {
      clearInterval(intervalId);
    };
  }, [lastDraft?.updatedAt]);

  const profileOptions = useMemo(
    () => [
      {
        label: 'Start a new profile from scratch',
        value: ProfileOptions.FROM_SCRATCH,
      },
      {
        label: `Continue working on your last draft (Last saved ${lastDraftUpdatedFromNow})`,
        hoverText: `Last saved - ${formatDateTime(lastDraft?.updatedAt)}`,
        value: ProfileOptions.DRAFT,
        hidden: !lastDraft,
      },
      {
        label: 'Start from a generic profile',
        value: ProfileOptions.GENERIC,
        disabled: true,
      },
    ],
    [lastDraft, lastDraftUpdatedFromNow],
  );

  return (
    <Form className='w-full'>
      <div>
        <div className='planning-form-box'>
          <Radio
            legend='Select how do you want to start with'
            name='profileOption'
            options={profileOptions}
          />

          <div
            className='p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-200 dark:text-blue-800'
            role='alert'
          >
            <span className='font-bold'>This feature is currently under development</span>
          </div>
        </div>

        <div>
          <div>
            {isLoading && <Spinner show />}
            {values.profileOption !== ProfileOptions.GENERIC && !isLoading && (
              <div className='planning-form-box'>
                <RenderSelect
                  label={'Select Care Setting'}
                  options={careLocations}
                  name='careLocation'
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalWrapper
        isOpen={showModal}
        setIsOpen={setShowModal}
        title='Changing Care Setting?'
        description='Changing Care settings removes any previously selected care activities.'
        closeButton={{ title: 'Ok' }}
      />
    </Form>
  );
};

interface ConfirmDraftRemoveProps {
  showModal: boolean;
  setShowModal: Dispatch<SetStateAction<boolean>>;
  handleSubmit: (values: SaveProfileDTO) => Promise<void>;
  lastDraft?: PlanningSessionRO;
}

const ConfirmDraftRemove = ({
  showModal,
  setShowModal,
  handleSubmit,
  lastDraft,
}: ConfirmDraftRemoveProps) => {
  const { values, resetForm } = useFormikContext<ProfileFormProps>();
  const { mutate: refetchUser } = useMe();

  return (
    <ModalWrapper
      isOpen={showModal}
      setIsOpen={setShowModal}
      title='Profile in draft'
      closeButton={{
        title: 'Cancel',
        onClick: () => {
          /* Only want to reset the "do not show draft" checkbox,
        leave anything selected outside of the modal untouched*/
          resetForm({ values: { ...values, userPrefNotShowConfirmDraftRemoval: false } });
          setShowModal(false);
        },
      }}
      actionButton={{
        title: 'Continue the process',
        onClick: async () => {
          await handleSubmit(values);
          refetchUser();
        },
      }}
    >
      <div className='p-4 text-sm'>
        <p>
          You have an incomplete draft profile stored in the system. Here are the details of the
          draft profile:
        </p>

        <div className='pt-4'>
          <p className='font-bold'>Care setting:</p>
          <p>{lastDraft?.careSetting.name}</p>
        </div>
        <div className='pt-2'>
          <p className='font-bold'>Care activity bundles:</p>
          <p>{lastDraft?.bundles.map(bundle => bundle.name).join(', ')}</p>
        </div>
        <div className='pt-2'>
          <p className='font-bold'>Last saved on:</p>
          <p>{formatDateTime(lastDraft?.updatedAt)}</p>
        </div>

        <div className='pt-4'>
          <p>
            Please keep in mind that selecting “Start from scratch” will result in the removal of
            your last saved draft.
          </p>
        </div>
        <div className='pt-8'>
          <Checkbox label={`Don't show this again`} name='userPrefNotShowConfirmDraftRemoval' />
        </div>
      </div>
    </ModalWrapper>
  );
};

export const Profile: React.FC<ProfileProps> = () => {
  const { handleSubmit, initialValues, lastDraft, isLoading } = usePlanningProfile();
  const { me } = useMe();

  const [showModal, setShowModal] = useState(false);
  // Used to check if the user selected not to see the draft modal
  const authUserPreference = me?.userPreference || {};

  return (
    <Formik
      initialValues={initialValues}
      validate={values => dtoValidator(SaveProfileDTO, values)}
      onSubmit={values => {
        // if last draft exists, and the user does not select it, trigger modal that will confirm deletion of the saved draft.
        // Do not show the modal if the user set their preference as such
        if (
          lastDraft &&
          values.profileOption !== ProfileOptions.DRAFT &&
          !authUserPreference.notShowConfirmDraftRemoval
        ) {
          setShowModal(true);
          return;
        }

        return handleSubmit(values);
      }}
      validateOnBlur={true}
      validateOnMount={true}
      enableReinitialize={true}
    >
      <>
        <ProfileForm lastDraft={lastDraft} isLoading={isLoading} />
        {showModal && (
          <ConfirmDraftRemove
            showModal={showModal}
            setShowModal={setShowModal}
            handleSubmit={handleSubmit}
            lastDraft={lastDraft}
          />
        )}
      </>
    </Formik>
  );
};
