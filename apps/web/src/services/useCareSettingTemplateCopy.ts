/**
 * Care Setting Template Copy Hook
 *
 * Creates a copy of an existing care setting template (including master templates).
 * Supports both simple copy (copies source data) and full copy (with custom data).
 *
 * @returns Object with handleCopy, handleCopyWithData functions and loading state
 */
import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { useHttp } from './useHttp';
import {
  CareSettingTemplateRO,
  CreateCareSettingTemplateCopyDTO,
  CreateCareSettingTemplateCopyFullDTO,
} from '@tbcm/common';
import { toast } from 'react-toastify';

export const useCareSettingTemplateCopy = () => {
  const { sendApiRequest, isLoading } = useHttp();

  /**
   * Create a simple copy (copies all data from source)
   * @deprecated Use handleCopyWithData for deferred copy creation
   */
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

  /**
   * Create a copy with full customization data (deferred copy creation)
   * Use this when user has completed the wizard and is ready to save
   */
  const handleCopyWithData = async (
    sourceId: string,
    data: CreateCareSettingTemplateCopyFullDTO,
  ): Promise<CareSettingTemplateRO | null> => {
    const config = {
      endpoint: API_ENDPOINT.copyCareSettingTemplateFull(sourceId),
      method: REQUEST_METHOD.POST,
      data,
    };

    let result: CareSettingTemplateRO | null = null;

    await sendApiRequest(
      config,
      (response: CareSettingTemplateRO) => {
        result = response;
        toast.info('Care setting created successfully.');
      },
      () => void 0,
    );

    return result;
  };

  return { handleCopy, handleCopyWithData, isLoading };
};
