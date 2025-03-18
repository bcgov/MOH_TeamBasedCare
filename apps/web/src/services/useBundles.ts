import { BundleRO } from '@tbcm/common';
import { API_ENDPOINT } from 'src/common';
import { AxiosPublic } from 'src/utils';
import useSWR from 'swr';

export const useBundles = () => {
  const {
    data: bundles,
    isValidating: isLoading,
    ...response
  } = useSWR<BundleRO[]>(
    API_ENDPOINT.BUNDLES,
    (url: string) => AxiosPublic(url).then(res => res.data),
    { revalidateOnFocus: false },
  );

  return { bundles, isLoading, ...response };
};
