/**
 * Limits and Conditions Catalogue Hook
 *
 * Loads the selectable limits offered when a permission is set to LC.
 * The catalogue is small and changes rarely, so it is fetched through SWR:
 * the cache is shared across mounts and concurrent renders are de-duplicated,
 * which is what keeps the finalize step from requesting it twice under React's
 * strict-mode double effect.
 */
import useSWR from 'swr';
import { toast } from 'react-toastify';
import { API_ENDPOINT } from '../common';
import { AxiosPublic } from '../utils';
import { LimitConditionRO } from '@tbcm/common';

const EMPTY: LimitConditionRO[] = [];

export const useLimitsConditions = () => {
  const {
    data,
    isValidating: isLoading,
    mutate,
  } = useSWR<LimitConditionRO[]>(
    API_ENDPOINT.CMS_LIMITS_CONDITIONS,
    (url: string) => AxiosPublic(url).then(res => res.data),
    {
      revalidateOnFocus: false,
      onError: () => toast.error('Error fetching data'),
    },
  );

  return { limits: data ?? EMPTY, isLoading, onRefresh: () => mutate() };
};
