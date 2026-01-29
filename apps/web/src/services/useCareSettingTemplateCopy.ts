/**
 * Care Setting Template Copy Hook
 *
 * Creates a copy of an existing care setting template (including master templates).
 * The new copy can be customized by the user.
 *
 * @returns Object with handleCopy function and loading state
 */
import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { useHttp } from './useHttp';
import { CareSettingTemplateRO, CreateCareSettingTemplateCopyDTO } from '@tbcm/common';
import { toast } from 'react-toastify';

export const useCareSettingTemplateCopy = () => {
  const { sendApiRequest, isLoading } = useHttp();

  const handleCopy = async (
    id: string,
    data: CreateCareSettingTemplateCopyDTO,
  ): Promise<CareSettingTemplateRO | null> => {
    const config = {
      endpoint: API_ENDPOINT.copyCareSettingTemplate(id),
      method: REQUEST_METHOD.POST,
      data,
    };

    let result: CareSettingTemplateRO | null = null;

    await sendApiRequest(
      config,
      (response: CareSettingTemplateRO) => {
        result = response;
        toast.info('Care setting copy created successfully.');
      },
      () => void 0,
    );

    return result;
  };

  return { handleCopy, isLoading };
};
