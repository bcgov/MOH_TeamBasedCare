import { useState, useCallback } from 'react';
import { API_ENDPOINT } from '../common';
import { KPIsOverviewRO } from '@tbcm/common';
import { AxiosPublic } from 'src/utils';
import useSWR from 'swr';

export interface KPIFilters {
  healthAuthority: string;
  careSettingId: string;
}

export const useKPIs = () => {
  const [filters, setFilters] = useState<KPIFilters>({
    healthAuthority: '',
    careSettingId: '',
  });

  // Build the endpoint URL with filters
  const getEndpoint = useCallback(() => {
    return API_ENDPOINT.getKPIOverview({
      healthAuthority: filters.healthAuthority || undefined,
      careSettingId: filters.careSettingId || undefined,
    });
  }, [filters]);

  const response = useSWR<KPIsOverviewRO>(
    getEndpoint(),
    (url: string) => AxiosPublic(url).then(res => res.data),
    {
      revalidateOnFocus: false,
    },
  );

  const setHealthAuthorityFilter = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, healthAuthority: value }));
  }, []);

  const setCareSettingFilter = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, careSettingId: value }));
  }, []);

  return {
    overview: response.data ?? null,
    isLoading: !response.error && !response.data,
    isError: response.error,
    filters,
    setHealthAuthorityFilter,
    setCareSettingFilter,
    mutate: response.mutate,
  };
};

export const useKPICareSettings = () => {
  const response = useSWR<{ id: string; displayName: string }[]>(
    API_ENDPOINT.KPI_CARE_SETTINGS,
    (url: string) => AxiosPublic(url).then(res => res.data),
    {
      revalidateOnFocus: false,
    },
  );

  return {
    careSettings: response.data ?? [],
    isLoading: !response.error && !response.data,
    isError: response.error,
  };
};
