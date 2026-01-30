import { useCallback, useState } from 'react';
import { AxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';
import { AxiosPublic } from '../utils';
import { REQUEST_METHOD } from '../common';
import { clearStorageAndRedirectToLandingPage } from 'src/utils/token';

export interface RequestConfig extends AxiosRequestConfig {
  endpoint: string;
}

export const useHttp = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const errorHandler = (err: any, toastMessage?: string) => {
    if (toastMessage) {
      toast.error(toastMessage);
    } else {
      switch (err?.response?.status) {
        case 401:
          clearStorageAndRedirectToLandingPage();
          break;
        case 400:
          const errorMsg = err?.response?.data?.errorMessage || err?.response?.data?.message || 'Kindly verify the input';
          toast.error(errorMsg);
          break;
        case 403:
          const forbiddenMsg = err?.response?.data?.errorMessage || err?.response?.data?.message || 'Access denied';
          toast.error(forbiddenMsg);
          break;
        case 409:
          toast.error(err.response.data.errorMessage);
          break;
        default:
          toast.error(err?.response?.data?.errorMessage || err?.response?.data?.message || 'Error fetching data');
      }
    }
  };

  const fetchData = useCallback(
    async (
      requestConfig: RequestConfig,
      handleData: (data: any) => void,
      errorToastMessage?: string,
      handleError?: () => void,
    ) => {
      const configOptions: Partial<RequestConfig> = {
        method: REQUEST_METHOD.GET,
        params: requestConfig?.params,
        data: requestConfig?.data,
        ...requestConfig,
      };
      try {
        setIsLoading(true);
        const { data } = await AxiosPublic(requestConfig.endpoint, configOptions);
        handleData(data);
      } catch (err) {
        handleError?.();

        errorHandler(err, errorToastMessage);
      }
      setIsLoading(false);
    },
    [],
  );

  const sendApiRequest = useCallback(
    async (
      requestConfig: RequestConfig,

      handleData: (result?: any) => void,
      handleError?: () => void,
      errorToastMessage?: string,
    ) => {
      const configOptions: Partial<RequestConfig> = {
        method: requestConfig.method,
        params: requestConfig?.params,
        data: requestConfig?.data,
        ...requestConfig,
      };
      setIsLoading(true);
      try {
        const { data } = await AxiosPublic(requestConfig.endpoint, configOptions);
        setIsLoading(false);
        handleData(data);
      } catch (err) {
        if (handleError) {
          handleError();
        }

        errorHandler(err, errorToastMessage);
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    sendApiRequest,
    setIsLoading,
    isLoading,
    fetchData,
  };
};
