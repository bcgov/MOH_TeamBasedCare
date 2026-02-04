import { BundleRO, PaginationRO } from '@tbcm/common';
import { API_ENDPOINT } from 'src/common';
import { AxiosPublic } from 'src/utils';
import useSWR from 'swr';

export const useBundlesWithActivities = () => {
  const {
    data,
    isValidating: isLoading,
    ...response
  } = useSWR<PaginationRO<BundleRO>>(
    API_ENDPOINT.CARE_ACTIVITIES,
    (url: string) => AxiosPublic(url).then(res => res.data),
    { revalidateOnFocus: false },
  );

  return { bundles: data?.result || [], isLoading, ...response };
};
