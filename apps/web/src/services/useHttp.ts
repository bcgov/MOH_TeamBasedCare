import { useCallback, useState } from 'react';
import { AxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';
import { AxiosPublic } from '../utils';
import { REQUEST_METHOD } from '../common';

export interface RequestConfig extends AxiosRequestConfig {
  endpoint: string;
}

export const useHttp = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const errorHandler = (err: any) => {
    if (err?.response?.status === 400) {
      toast.error('Kindly verify the input');
    } else {
      toast.error(err?.response?.data?.message ?? 'Error fetching data');
    }
  };

  const fetchData = useCallback(async (requestConfig: RequestConfig, handleData) => {
    const configOptions: Partial<RequestConfig> = {
      method: REQUEST_METHOD.GET,
      params: requestConfig?.params,
      data: requestConfig?.data,
    };
    try {
      setIsLoading(true);
      const { data } = await AxiosPublic(requestConfig.endpoint, configOptions);
      handleData(data);
    } catch (err: any) {
      errorHandler(err);
    }
    setIsLoading(false);
  }, []);

  const sendApiRequest = async (
    requestConfig: RequestConfig,
    handleData: any,
    handleError?: any,
  ) => {
    const configOptions: Partial<RequestConfig> = {
      method: requestConfig.method,
      params: requestConfig?.params,
      data: requestConfig?.data,
    };
    setIsLoading(true);
    try {
      const { data } = await AxiosPublic(requestConfig.endpoint, configOptions);
      setIsLoading(false);
      handleData(data);
    } catch (err: any) {
      if (handleError) {
        handleError();
      }
      errorHandler(err);
      setIsLoading(false);
    }
  };

  return {
    sendApiRequest,
    setIsLoading,
    isLoading,
    fetchData,
  };
};
