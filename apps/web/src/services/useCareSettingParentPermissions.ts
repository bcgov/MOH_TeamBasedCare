/**
 * Parent Permissions Hook
 *
 * Loads the direct parent's permissions, used as the baseline for the
 * permission badge. LC details travel with each row so a limit-only or
 * description-only difference can be detected. An undefined baseline means
 * unavailable; only a successful response can establish an empty parent.
 */
import useSWR from 'swr';
import { API_ENDPOINT } from '../common';
import { AxiosPublic } from 'src/utils';
import { ParentPermissionRO } from '@tbcm/common';

export type ParentPermission = ParentPermissionRO;

export const useParentPermissions = (templateId?: string) => {
  const { data, error, isValidating, mutate } = useSWR<ParentPermission[]>(
    templateId ? API_ENDPOINT.getCareSettingParentPermissions(templateId) : null,
    (url: string) => AxiosPublic(url).then(response => response.data),
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      shouldRetryOnError: false,
    },
  );

  // An unavailable baseline is not an empty parent. Invalidate comparisons
  // during refreshes too, rather than asserting equality against stale data.
  return {
    parentPermissions: !error && !isValidating ? data : undefined,
    isLoading: Boolean(templateId && !error && (isValidating || data === undefined)),
    error,
    onRefresh: mutate,
  };
};
