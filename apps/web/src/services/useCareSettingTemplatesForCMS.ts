import { API_ENDPOINT } from '../common';
import { CareSettingTemplateRO } from '@tbcm/common';
import { OptionType } from 'src/components/generic/RenderSelect';
import { AxiosPublic } from 'src/utils';
import useSWR from 'swr';

/** Suffix appended to master template names - stripped for display */
const MASTER_TEMPLATE_SUFFIX = ' - Master';

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
      label: t.name.replace(new RegExp(`${MASTER_TEMPLATE_SUFFIX}$`), ''),
    })) ?? [];

  return { careSettingTemplates, ...response };
};
