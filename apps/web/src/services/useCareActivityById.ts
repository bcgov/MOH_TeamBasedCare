import { CareActivityDetailRO } from '@tbcm/common';
import { API_ENDPOINT } from 'src/common';
import { AxiosPublic } from 'src/utils';
import useSWR from 'swr';

export const useCareActivityById = (id: string, unitId: string) => {
  const {
    data: careActivity,
    isValidating: isLoading,
    ...response
  } = useSWR<CareActivityDetailRO>(
    `${API_ENDPOINT.CARE_ACTIVITY}/${id}?unitId=${unitId}`,
    id ? (url: string) => AxiosPublic(url).then(res => res.data) : null,
    { revalidateOnFocus: false },
  );

  return { careActivity, isLoading, ...response };
};
