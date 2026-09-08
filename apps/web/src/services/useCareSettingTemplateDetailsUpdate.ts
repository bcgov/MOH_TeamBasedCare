/**
 * Care Setting Template Details Update Hook
 *
 * Updates only a template's name and level, from the Edit Details dialog.
 * Deliberately separate from `useCareSettingTemplateUpdate`, which replaces
 * the whole template including every permission row.
 *
 * A `409` is surfaced distinctly so the caller can offer reload-or-override
 * rather than showing a generic error.
 */
import { API_ENDPOINT, REQUEST_METHOD } from '../common';
import { CareSettingTemplateRO, TemplateLevel } from '@tbcm/common';
import { toast } from 'react-toastify';
import { AxiosPublic, INVALID_TEMPLATE_ID_MESSAGE, SAFE_TEMPLATE_ID } from '../utils';
import { useState } from 'react';
import { TemplateVersionConflict, parseVersionConflict } from './templateVersionConflict';

export interface UpdateTemplateDetailsPayload {
  name: string;
  level: TemplateLevel;
  expectedVersion: number;
}

export const useUpdateTemplateDetails = () => {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Resolves to the updated template on success, a conflict descriptor when the
   * template changed underneath us, or null for any other failure (which has
   * already been surfaced as a toast).
   */
  const handleUpdateDetails = async (
    id: string,
    data: UpdateTemplateDetailsPayload,
  ): Promise<
    | { status: 'success'; template: CareSettingTemplateRO }
    | { status: 'conflict'; conflict: TemplateVersionConflict }
    | { status: 'error'; message: string }
  > => {
    // The id comes from the route, so it is checked before it is built into a
    // request path.
    if (!SAFE_TEMPLATE_ID.test(id)) {
      return { status: 'error', message: INVALID_TEMPLATE_ID_MESSAGE };
    }

    setIsLoading(true);

    try {
      const response = await AxiosPublic(API_ENDPOINT.updateCareSettingTemplateDetails(id), {
        method: REQUEST_METHOD.PATCH,
        data,
      });

      toast.info('Care setting details updated successfully.');
      return { status: 'success', template: response.data };
    } catch (err: any) {
      const conflict = parseVersionConflict(err);
      if (conflict) {
        return { status: 'conflict', conflict };
      }

      const message =
        err?.response?.data?.errorMessage ||
        err?.response?.data?.message ||
        'Failed to update care setting details.';

      return { status: 'error', message };
    } finally {
      setIsLoading(false);
    }
  };

  return { handleUpdateDetails, isLoading };
};
