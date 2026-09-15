/**
 * Lightweight hook for fetching template data during copy flow.
 * Uses the copy-data endpoint which returns IDs only, avoiding the heavy
 * permission entity loading that can timeout on master templates.
 */
import useSWR from 'swr';
import { CareSettingTemplateCopyRO } from '@tbcm/common';
import { API_ENDPOINT } from 'src/common';
import { AxiosPublic } from 'src/utils';

export const useCareSettingTemplateForCopy = (sourceId: string) => {
  const {
    data: template,
    isValidating: isLoading,
    error,
  } = useSWR<CareSettingTemplateCopyRO>(
    sourceId ? API_ENDPOINT.getCareSettingTemplateForCopy(sourceId) : null,
    sourceId ? (url: string) => AxiosPublic(url).then(res => res.data) : null,
    { revalidateOnFocus: false, revalidateOnMount: true },
  );

  return { template, isLoading, error };
};
