import { useEffect, useState } from 'react';
import { API_ENDPOINT } from '../common';
import { OptionType } from '../components/generic/RenderSelect';
import { useHttp } from './useHttp';

export const useExportToCsv = () => {
  const { fetchData, isLoading } = useHttp();
  const [csvData, setCsvData] = useState([]);

  useEffect(() => {
    const config = { endpoint: API_ENDPOINT.getExportCsv };

    fetchData(config, (data: any) => {
      setCsvData(data);
      console.log(data);
    });
  }, []);

  return { csvData, isLoading };
};
