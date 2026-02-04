/**
 * Care Setting Occupations Hook
 *
 * Fetches all occupations available for permission assignment.
 * Occupations are global (not unit-specific) and used in the
 * finalize step to set activity permissions per occupation.
 *
 * @param templateId - Template UUID (optional, skips fetch if not provided)
 * @returns Object with occupations array, loading state, and error
 */
import { OccupationRO } from '@tbcm/common';
import { API_ENDPOINT } from 'src/common';
import { AxiosPublic } from 'src/utils';
import useSWR from 'swr';

export const useCareSettingOccupations = (templateId?: string) => {
  const {
    data: occupations,
    isValidating: isLoading,
    error,
  } = useSWR<OccupationRO[]>(
    templateId ? API_ENDPOINT.getCareSettingOccupations(templateId) : null,
    templateId ? (url: string) => AxiosPublic(url).then(res => res.data) : null,
    { revalidateOnFocus: false },
  );

  return { occupations: occupations || [], isLoading, error };
};
