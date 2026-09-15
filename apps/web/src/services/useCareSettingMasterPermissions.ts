/**
 * Master Permissions Hook
 *
 * Loads the provincial master's permissions, used as the baseline for the
 * "Changes made by HA" badge. The master is found at the top of the template's
 * chain whatever the depth, so every level is measured against the same
 * standard.
 *
 * Explicit status distinguishes loading, failure and a missing master from a
 * successfully loaded master with no permitted activities (implicit N).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { API_ENDPOINT } from '../common';
import { useHttp } from './useHttp';
import { CareSettingMasterPermissionsRO } from '@tbcm/common';

export type MasterPermission = CareSettingMasterPermissionsRO['permissions'][number];
export type MasterBaselineStatus = 'loading' | 'ready' | 'missing' | 'failed';

const EMPTY_PERMISSIONS: MasterPermission[] = [];

export const useMasterPermissions = (templateId?: string) => {
  const { fetchData } = useHttp();
  const requestVersion = useRef(0);
  const [baseline, setBaseline] = useState<{
    templateId?: string;
    status: MasterBaselineStatus;
    permissions: MasterPermission[];
  }>({ status: 'loading', permissions: EMPTY_PERMISSIONS });

  const onRefresh = useCallback(() => {
    const version = ++requestVersion.current;
    setBaseline({ templateId, status: 'loading', permissions: EMPTY_PERMISSIONS });
    if (!templateId) {
      return;
    }

    fetchData(
      { endpoint: API_ENDPOINT.getCareSettingMasterPermissions(templateId) },
      (data: CareSettingMasterPermissionsRO) => {
        if (version !== requestVersion.current) return;
        if (
          !data ||
          !(data.masterId === null || typeof data.masterId === 'string') ||
          !Array.isArray(data.permissions)
        ) {
          throw new Error('Invalid provincial baseline response');
        }
        setBaseline({
          templateId,
          status: data.masterId === null ? 'missing' : 'ready',
          permissions: data.permissions,
        });
      },
      undefined,
      () => {
        if (version === requestVersion.current) {
          setBaseline({ templateId, status: 'failed', permissions: EMPTY_PERMISSIONS });
        }
      },
    );
  }, [fetchData, templateId]);

  useEffect(() => {
    onRefresh();
    return () => {
      requestVersion.current++;
    };
  }, [onRefresh]);

  // Never expose the previous template's baseline during a route change.
  const status = baseline.templateId === templateId ? baseline.status : 'loading';
  return {
    masterPermissions: status === 'ready' ? baseline.permissions : EMPTY_PERMISSIONS,
    status,
    isLoading: status === 'loading',
    hasFailed: status === 'failed',
    onRefresh,
  };
};
