/**
 * Care Setting Template Detail Hook
 *
 * Fetches a single care setting template with all its details including
 * selected bundles, activities, and occupation permissions.
 *
 * Uses SWR for caching and automatic revalidation.
 *
 * @param id - Template UUID (optional, skips fetch if not provided)
 * @returns Object with template data, loading state, error, and mutate function
 */
import { CareSettingTemplateDetailRO } from '@tbcm/common';
import { API_ENDPOINT } from 'src/common';
import { AxiosPublic } from 'src/utils';
import useSWR from 'swr';

export const useCareSettingTemplate = (id?: string) => {
  const {
    data: template,
    isValidating: isLoading,
    error,
    mutate,
  } = useSWR<CareSettingTemplateDetailRO>(
    id ? API_ENDPOINT.getCareSettingTemplate(id) : null,
    id ? (url: string) => AxiosPublic(url).then(res => res.data) : null,
    { revalidateOnFocus: false, revalidateOnMount: true },
  );

  return { template, isLoading, error, mutate };
};
