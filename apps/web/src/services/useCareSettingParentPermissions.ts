/**
 * Parent Permissions Hook
 *
 * Loads the direct parent's permissions, used as the baseline for the
 * "Changes made by HA" badge. Returns an empty list for a template with no
 * parent, so no badge is ever shown on one.
 */
import { useCallback, useEffect, useState } from 'react';
import { API_ENDPOINT } from '../common';
import { useHttp } from './useHttp';
import { Permissions } from '@tbcm/common';

export interface ParentPermission {
  activityId: string;
  occupationId: string;
  permission: Permissions;
}

export const useParentPermissions = (templateId?: string) => {
  const { fetchData, isLoading } = useHttp();
  const [parentPermissions, setParentPermissions] = useState<ParentPermission[]>([]);

  const onRefresh = useCallback(() => {
    if (!templateId) {
      setParentPermissions([]);
      return;
    }

    fetchData(
      { endpoint: API_ENDPOINT.getCareSettingParentPermissions(templateId) },
      (data: ParentPermission[]) => setParentPermissions(data ?? []),
    );
  }, [fetchData, templateId]);

  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  return { parentPermissions, isLoading, onRefresh };
};
