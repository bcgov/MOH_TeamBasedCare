import { API_ENDPOINT } from '../common';
import { UnitRO } from '@tbcm/common';
import { OptionType } from 'src/components/generic/RenderSelect';
import { AxiosPublic } from 'src/utils';
import useSWR from 'swr';

export const useCareLocations = () => {
  const response = useSWR<UnitRO[]>(API_ENDPOINT.CARE_LOCATIONS, (url: string) =>
    AxiosPublic(url).then(res => res.data),
  );

  const careLocations: OptionType[] =
    response.data?.map(unit => ({
      value: unit.id,
      label: unit.displayName ?? '',
    })) ?? [];

  return { careLocations, ...response };
};
