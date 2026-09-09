import { PlanningSessionRO, ProfileOptions, SaveProfileDTO } from '@tbcm/common';
import { useCallback, useState, useEffect } from 'react';
import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { useHttp } from './useHttp';
import { usePlanningContext } from './usePlanningContext';

export const usePlanningProfile = () => {
  const {
    state: { sessionId },
    updateProceedToNext,
    updateSessionId,
    updateSessionName,
    refreshSessionsList,
    promptForSessionName,
  } = usePlanningContext();

  /**
   * Holds the values of a save that did not complete, so the planner can retry it from a
   * persistent banner rather than losing the attempt to a transient toast (FR-005).
   */
  const [failedSave, setFailedSave] = useState<SaveProfileDTO>();

  const [initialValues] = useState<SaveProfileDTO>({
    profileOption: ProfileOptions.FROM_SCRATCH,
    careLocation: '',
  });

  const [lastDraft, setLastDraft] = useState<PlanningSessionRO>();

  const { sendApiRequest, fetchData, isLoading } = useHttp();

  // check if the previously saved draft session exists
  useEffect(() => {
    fetchData({ endpoint: API_ENDPOINT.LAST_DRAFT_SESSION }, (data: PlanningSessionRO) => {
      if (data?.id) {
        // if previously fetched session, save the draft for
        // 1. on radio change, switch initial values
        // 2. if profile option is draft, update this value before submitting [API does not need to know draft]
        setLastDraft(data);
      }
    });
  }, []);

  const handleSubmit = async (values: SaveProfileDTO) => {
    // BE does not need to store draft as Profile Option :: So, reset before submitting
    const data: SaveProfileDTO = {
      ...values,
      profileOption:
        values.profileOption === ProfileOptions.DRAFT
          ? lastDraft?.profileOption || ProfileOptions.FROM_SCRATCH
          : values.profileOption,
    };

    // create a session if does not exist
    if (!sessionId) {
      const config = {
        endpoint: API_ENDPOINT.SESSIONS,
        method: REQUEST_METHOD.POST,
        data,
      };

      await sendApiRequest(
        config,
        (created: PlanningSessionRO) => {
          setFailedSave(undefined);
          updateSessionId(created.id);
          updateSessionName(created.name);
          // the drafts table is mounted on this stage and must show the new row
          refreshSessionsList();
          // the prompt is owned by the wizard, so it survives the stage change below
          promptForSessionName({ id: created.id, name: created.name });
          updateProceedToNext();
        },
        () => setFailedSave(values),
      );

      return;
    }

    // patch the result if session already exists
    await sendApiRequest(
      {
        method: REQUEST_METHOD.PATCH,
        data: values,
        endpoint: API_ENDPOINT.getPlanningProfile(sessionId),
      },
      () => {
        setFailedSave(undefined);
        updateProceedToNext();
      },
      () => setFailedSave(values),
    );
  };

  const retryFailedSave = useCallback(() => {
    if (!failedSave) return;

    handleSubmit(failedSave);
  }, [failedSave, sessionId]);

  return {
    handleSubmit,
    initialValues,
    lastDraft,
    isLoading,
    hasFailedSave: Boolean(failedSave),
    retryFailedSave,
  };
};
