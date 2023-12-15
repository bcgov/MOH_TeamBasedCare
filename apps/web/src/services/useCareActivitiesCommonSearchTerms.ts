import { useEffect, useState } from 'react';
import { API_ENDPOINT } from '../common';
import { useHttp } from './useHttp';

export const useCareActivitySearchTerms = () => {
  const { fetchData, isLoading } = useHttp();
  const [careActivitySearchTerms, setCareActivitySearchTerms] = useState<string[]>([]);

  useEffect(() => {
    const config = {
      endpoint: API_ENDPOINT.CARE_ACTIVITY_COMMON_SEARCH_TERMS,
    };

    fetchData(config, (data: string[]) => {
      setCareActivitySearchTerms(data);
    });
  }, [fetchData]);

  return {
    careActivitySearchTerms,
    isLoading,
  };
};
