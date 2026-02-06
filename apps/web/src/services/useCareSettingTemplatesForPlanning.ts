import { API_ENDPOINT } from '../common';
import { CareSettingTemplateRO } from '@tbcm/common';
import { OptionType } from 'src/components/generic/RenderSelect';
import { AxiosPublic } from 'src/utils';
import useSWR from 'swr';

export const useCareSettingTemplatesForPlanning = () => {
  const response = useSWR<CareSettingTemplateRO[]>(
    API_ENDPOINT.PLANNING_CARE_SETTING_TEMPLATES,
    (url: string) => AxiosPublic(url).then(res => res.data),
  );

  const careLocations: OptionType[] =
    response.data?.map(t => ({
      value: t.id,
      label: (t.isMaster ? t.unitName : t.name) || '',
    })) ?? [];

  return { careLocations, ...response };
};
