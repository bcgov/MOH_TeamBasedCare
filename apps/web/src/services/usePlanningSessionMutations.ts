import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { PlanningSessionSummaryRO } from '@tbcm/common';
import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { AxiosPublic } from 'src/utils';

export interface MutationResult<T = void> {
  ok: boolean;
  error?: string;
  data?: T;
  /** True when the server reports the session no longer exists or is no longer accessible. */
  gone?: boolean;
}

/**
 * SessionGuard denies access by returning false, which Nest surfaces as 403 rather
 * than 404, so a discarded session can present as either status.
 */
const GONE_STATUSES = [403, 404];

export const SESSION_GONE_MESSAGE =
  'This draft is no longer available. It may have already been discarded.';

const parseErrorMessage = (err: any, fallback: string): string => {
  const responseData = err?.response?.data;
  const apiErrorMessage = responseData?.errorMessage ?? responseData?.message;

  if (typeof apiErrorMessage === 'string') {
    return apiErrorMessage;
  }

  if (Array.isArray(apiErrorMessage)) {
    // NestJS validation pipe format: [[{property, errors}], ...]
    const validationErrors = apiErrorMessage
      .flat(3)
      .filter((item: any) => item?.errors)
      .flatMap((item: any) => item.errors)
      .join(', ');

    if (validationErrors) return validationErrors;
  }

  return fallback;
};

export const usePlanningSessionMutations = () => {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * A 400 resolves rather than throwing and deliberately raises no toast, so the
   * message can be rendered beside the input the planner is editing.
   */
  const renamePlanningSession = useCallback(
    async (sessionId: string, name: string): Promise<MutationResult<PlanningSessionSummaryRO>> => {
      setIsLoading(true);

      try {
        const { data } = await AxiosPublic(API_ENDPOINT.renamePlanningSession(sessionId), {
          method: REQUEST_METHOD.PATCH,
          data: { name },
        });

        return { ok: true, data };
      } catch (err: any) {
        const status = err?.response?.status;

        if (GONE_STATUSES.includes(status)) {
          return { ok: false, error: SESSION_GONE_MESSAGE, gone: true, data: undefined };
        }

        const error = parseErrorMessage(err, 'Failed to rename the draft.');

        if (status !== 400) {
          toast.error(error);
        }

        return { ok: false, error, data: undefined };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const discardPlanningSession = useCallback(async (sessionId: string): Promise<MutationResult> => {
    setIsLoading(true);

    try {
      await AxiosPublic(API_ENDPOINT.discardPlanningSession(sessionId), {
        method: REQUEST_METHOD.DELETE,
      });

      toast.success('Draft discarded.');

      return { ok: true };
    } catch (err: any) {
      if (GONE_STATUSES.includes(err?.response?.status)) {
        return { ok: false, error: SESSION_GONE_MESSAGE, gone: true };
      }

      const error = parseErrorMessage(err, 'Failed to discard the draft.');
      toast.error(error);

      return { ok: false, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Confirms a session is still reachable before the planner is moved into the
   * wizard, so a row left stale by another tab fails with a recoverable message
   * instead of loading an empty stage (FR-040).
   */
  const verifyPlanningSession = useCallback(async (sessionId: string): Promise<MutationResult> => {
    try {
      await AxiosPublic(API_ENDPOINT.getPlanningProfile(sessionId), {
        method: REQUEST_METHOD.GET,
      });

      return { ok: true };
    } catch (err: any) {
      if (GONE_STATUSES.includes(err?.response?.status)) {
        return { ok: false, error: SESSION_GONE_MESSAGE, gone: true };
      }

      const error = parseErrorMessage(err, 'Failed to open the draft.');
      toast.error(error);

      return { ok: false, error };
    }
  }, []);

  return { renamePlanningSession, discardPlanningSession, verifyPlanningSession, isLoading };
};
