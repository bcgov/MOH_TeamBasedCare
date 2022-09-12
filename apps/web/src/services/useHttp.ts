import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { AxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';
import { AxiosPublic } from '../utils';
import { REQUEST_METHOD } from '../common';

type HttpReturn = {
  sendApiRequest: any;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  isLoading: boolean;
  fetchData: any;
};

export const useHttp = (): HttpReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const controller = new AbortController();

  const errorHandler = (err: any) => {
    if (err?.response?.status === 400) {
      toast.error({
        status: 'error',
        message: 'Kindly verify the input',
      });
    } else {
      toast.error({
        status: 'error',
        message: err?.response?.data?.message ?? 'Error fetching data',
      });
    }
  };

  const fetchData = useCallback(async (requestConfig, handleData) => {
    const configOptions: AxiosRequestConfig = {
      method: REQUEST_METHOD.GET,
      params: requestConfig?.params,
      data: requestConfig?.data,
    };
    try {
      setIsLoading(true);
      const response = await AxiosPublic(requestConfig.endpoint, configOptions);
      handleData(response);
    } catch (err: any) {
      errorHandler(err);
    }
    setIsLoading(false);
  }, []);

  const sendApiRequest = async (requestConfig: any, handleData: any) => {
    const configOptions = {
      method: requestConfig.method,
      body: requestConfig?.body,
      params: requestConfig?.params,
      data: requestConfig?.data,
    };
    setIsLoading(true);
    try {
      const res = await AxiosPublic(requestConfig.endpoint, configOptions);
      setIsLoading(false);
      handleData(res);
    } catch (err: any) {
      errorHandler(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      controller.abort();
    };
  });

  return {
    sendApiRequest,
    setIsLoading,
    isLoading,
    fetchData,
  };
};
