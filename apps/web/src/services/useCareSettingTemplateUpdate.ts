/**
 * Care Setting Template Update Hook
 *
 * Updates a care setting template's name, selected bundles/activities,
 * and occupation permissions.
 *
 * Note: Master templates cannot be updated (enforced by backend).
 *
 * @returns Object with handleUpdate function and loading state
 */
import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { useHttp } from './useHttp';
import { UpdateCareSettingTemplateDTO } from '@tbcm/common';
import { toast } from 'react-toastify';

export const useCareSettingTemplateUpdate = () => {
  const { sendApiRequest, isLoading } = useHttp();

  const handleUpdate = async (
    id: string,
    data: UpdateCareSettingTemplateDTO,
    onSuccess?: () => void,
    onError?: () => void,
  ): Promise<boolean> => {
    const config = {
      endpoint: API_ENDPOINT.updateCareSettingTemplate(id),
      method: REQUEST_METHOD.PATCH,
      data,
    };

    let success = false;
    await sendApiRequest(
      config,
      () => {
        success = true;
        toast.info('Care setting updated successfully.');
        onSuccess?.();
      },
      () => {
        success = false;
        onError?.();
      },
      'Failed to update care setting.',
    );

    return success;
  };

  return { handleUpdate, isLoading };
};
