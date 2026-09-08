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
import { AxiosPublic } from '../utils';
import { useState } from 'react';
import { TemplateVersionConflict, parseVersionConflict } from './templateVersionConflict';

export const useCareSettingTemplateUpdate = () => {
  const { sendApiRequest } = useHttp();
  const [isLoading, setIsLoading] = useState(false);

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

  /**
   * Save variant that distinguishes a version conflict from an ordinary
   * failure, so the caller can offer reload-or-override instead of a toast
   * the administrator can only dismiss.
   */
  const handleUpdateWithConflict = async (
    id: string,
    data: UpdateCareSettingTemplateDTO,
  ): Promise<
    | { status: 'success' }
    | { status: 'conflict'; conflict: TemplateVersionConflict }
    | { status: 'error'; message: string }
  > => {
    setIsLoading(true);

    try {
      await AxiosPublic(API_ENDPOINT.updateCareSettingTemplate(id), {
        method: REQUEST_METHOD.PATCH,
        data,
      });

      toast.info('Care setting updated successfully.');
      return { status: 'success' };
    } catch (err: any) {
      const conflict = parseVersionConflict(err);
      if (conflict) {
        return { status: 'conflict', conflict };
      }

      const message =
        err?.response?.data?.errorMessage ||
        err?.response?.data?.message ||
        'Failed to update care setting.';
      toast.error(message);

      return { status: 'error', message };
    } finally {
      setIsLoading(false);
    }
  };

  return { handleUpdate, handleUpdateWithConflict, isLoading };
};
