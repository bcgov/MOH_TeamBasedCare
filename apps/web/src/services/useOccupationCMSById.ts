/**
 * Occupation CMS By ID Hook
 *
 * Fetches a single occupation with all details for the CMS edit form.
 * Uses SWR for caching and automatic revalidation.
 *
 * @param id - Occupation UUID (pass empty string to skip fetch)
 * @returns Object with occupation data, loading state, and mutate function
 *
 * @example
 * const { occupation, isLoading, mutate } = useOccupationCMSById(id);
 *
 * // After successful update:
 * mutate(); // Revalidate the data
 */

import { OccupationDetailRO } from '@tbcm/common';
import { API_ENDPOINT } from 'src/common';
import { AxiosPublic } from 'src/utils';
import useSWR from 'swr';

export const useOccupationCMSById = (id: string) => {
  const {
    data: occupation,
    isValidating: isLoading,
    mutate,
    ...response
  } = useSWR<OccupationDetailRO>(
    id ? API_ENDPOINT.getOccupationCMS(id) : null,
    id ? (url: string) => AxiosPublic(url).then(res => res.data) : null,
    { revalidateOnFocus: false },
  );

  return { occupation, isLoading, mutate, ...response };
};
