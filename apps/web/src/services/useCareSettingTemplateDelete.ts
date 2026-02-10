/**
 * Care Setting Template Delete Hook
 *
 * Deletes a care setting template and all its associated permissions.
 * Note: Master templates cannot be deleted (enforced by backend).
 *
 * @returns Object with handleDelete function and loading state
 */
import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { useHttp } from './useHttp';
import { CareSettingTemplateRO } from '@tbcm/common';
import { toast } from 'react-toastify';

export const useCareSettingTemplateDelete = () => {
  const { sendApiRequest, isLoading } = useHttp();

  const handleDelete = async (template: CareSettingTemplateRO, cb?: () => void) => {
    const config = {
      endpoint: API_ENDPOINT.deleteCareSettingTemplate(template.id),
      method: REQUEST_METHOD.DELETE,
    };

    await sendApiRequest(
      config,
      () => {
        cb?.();
        toast.info('Care setting deleted successfully.');
      },
      () => void 0,
      // Let useHttp extract backend error message (e.g., "Cannot delete template: it is referenced by X draft care plan(s).")
    );
  };

  return { handleDelete, isLoading };
};
