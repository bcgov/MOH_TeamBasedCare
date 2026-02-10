import { API_ENDPOINT } from '../common';
import { CareSettingTemplateRO, MASTER_TEMPLATE_SUFFIX } from '@tbcm/common';
import { OptionType } from 'src/components/generic/RenderSelect';
import { AxiosPublic } from 'src/utils';
import useSWR from 'swr';

export const useCareSettingTemplatesForCMS = () => {
  const response = useSWR<CareSettingTemplateRO[]>(
    API_ENDPOINT.CMS_CARE_SETTING_TEMPLATES_FILTER,
    (url: string) => AxiosPublic(url).then(res => res.data),
  );

  // Use template ID as value (unique), template name as label
  // Backend now filters by template ID directly
  const careSettingTemplates: OptionType[] =
    response.data?.map(t => ({
      value: t.id,
      label: (t.name ?? '').replace(new RegExp(`${MASTER_TEMPLATE_SUFFIX}$`), ''),
    })) ?? [];

  return { careSettingTemplates, ...response };
};
