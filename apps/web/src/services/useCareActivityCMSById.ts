import { CareActivityCMSDetailRO } from '@tbcm/common';
import { API_ENDPOINT } from 'src/common';
import { AxiosPublic } from 'src/utils';
import useSWR from 'swr';

export const useCareActivityCMSById = (id: string) => {
  const {
    data: careActivity,
    isValidating: isLoading,
    mutate,
    ...response
  } = useSWR<CareActivityCMSDetailRO>(
    id ? API_ENDPOINT.getCareActivityCMS(id) : null,
    id ? (url: string) => AxiosPublic(url).then(res => res.data) : null,
    { revalidateOnFocus: false },
  );

  return { careActivity, isLoading, mutate, ...response };
};
