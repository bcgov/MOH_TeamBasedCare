import { PlanningSessionRO, ProfileOptions, SaveProfileDTO } from '@tbcm/common';
import { useState, useEffect } from 'react';
import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { useHttp } from './useHttp';
import { usePlanningContext } from './usePlanningContext';

export const usePlanningProfile = () => {
  const {
    state: { sessionId },
    updateProceedToNext,
    updateSessionId,
  } = usePlanningContext();

  const [initialValues] = useState<SaveProfileDTO>({
    profileOption: '',
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

  const handleSubmit = (values: SaveProfileDTO) => {
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

      sendApiRequest(config, (data: PlanningSessionRO) => {
        updateSessionId(data.id);
        updateProceedToNext();
      });

      return;
    }

    // patch the result if session already exists
    sendApiRequest(
      {
        method: REQUEST_METHOD.PATCH,
        data: values,
        endpoint: API_ENDPOINT.getPlanningProfile(sessionId),
      },
      () => {
        updateProceedToNext();
      },
    );
  };

  return { handleSubmit, initialValues, lastDraft, isLoading };
};
