/**
 * Care Setting Bundles Hook
 *
 * Fetches all available bundles (care competencies) for a template's unit.
 * Each bundle includes its associated care activities.
 *
 * Used in the edit flow to display selectable competencies and activities.
 *
 * @param templateId - Template UUID (optional, skips fetch if not provided)
 * @returns Object with bundles array, loading state, and error
 */
import { BundleRO } from '@tbcm/common';
import { API_ENDPOINT } from 'src/common';
import { AxiosPublic } from 'src/utils';
import useSWR from 'swr';

export const useCareSettingBundles = (templateId?: string) => {
  const {
    data: bundles,
    isValidating: isLoading,
    error,
  } = useSWR<BundleRO[]>(
    templateId ? API_ENDPOINT.getCareSettingBundles(templateId) : null,
    templateId ? (url: string) => AxiosPublic(url).then(res => res.data) : null,
    { revalidateOnFocus: false },
  );

  return { bundles: bundles || [], isLoading, error };
};
