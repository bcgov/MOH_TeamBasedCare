import { useHttp } from '@services';
import { KeycloakToken } from '@tbcm/common';
import { useCallback } from 'react';
import { API_ENDPOINT } from 'src/common';
import { AppStorage, StorageKeys } from '../utils/storage';

export const useAuth = () => {
  const { sendApiRequest } = useHttp();

  const isAuthenticated = useCallback(() => {
    const now = +new Date();

    const accessToken = AppStorage.getItem(StorageKeys.ACCESS_TOKEN);
    const accessTokenExpiry = AppStorage.getItem(StorageKeys.ACCESS_TOKEN_EXPIRY);

    if (accessToken && accessTokenExpiry && +accessTokenExpiry > now) {
      return true;
    }

    return false;
  }, []);

  const storeAuthTokens = useCallback((data: KeycloakToken) => {
    const now = Date.now();

    AppStorage.setItem(StorageKeys.ACCESS_TOKEN, data.access_token);
    AppStorage.setItem(StorageKeys.ACCESS_TOKEN_EXPIRY, now + +data.expires_in * 1000);
    AppStorage.setItem(StorageKeys.REFRESH_TOKEN, data.refresh_token);
    AppStorage.setItem(StorageKeys.REFRESH_TOKEN_EXPIRY, now + +data.refresh_expires_in * 1000);
    AppStorage.setItem(StorageKeys.TOKENS_LAST_REFRESHED_AT, +now);
  }, []);

  const clearStorage = useCallback(() => {
    AppStorage.clear();
  }, []);

  const getAuthTokens = useCallback(() => {
    return {
      access_token: AppStorage.getItem(StorageKeys.ACCESS_TOKEN),
      refresh_token: AppStorage.getItem(StorageKeys.REFRESH_TOKEN),
    };
  }, []);

  const fetchAuthTokenFromCode = useCallback(
    (code: string, handler: () => void, errorHandler: () => void) => {
      const config = {
        endpoint: API_ENDPOINT.AUTH_CALLBACK,
        method: 'POST',
        body: { code },
      };

      sendApiRequest(
        config,
        (result: KeycloakToken) => {
          // update tokens to storage
          storeAuthTokens(result);

          // call success handler
          handler();
        },
        errorHandler,
      );
    },
    [sendApiRequest, storeAuthTokens],
  );

  const logMeIn = useCallback(() => {
    window.location.href = process.env.NEXT_PUBLIC_API_URL + API_ENDPOINT.AUTH_LOGIN;
  }, []);

  const logMeOut = useCallback(
    (handler: () => void, errorHandler: () => void) => {
      const config = { endpoint: API_ENDPOINT.AUTH_LOGOUT, method: 'POST', body: getAuthTokens() };

      // execute this handler under either cases - success/failure
      const commonHandler = () => {
        clearStorage();
        window.location.href = '/';
      };

      sendApiRequest(
        config,
        () => {
          commonHandler();
          handler();
        },
        () => {
          commonHandler();
          errorHandler();
        },
      );
    },
    [clearStorage, getAuthTokens, sendApiRequest],
  );

  const refreshAuthTokens = useCallback(
    (handler: () => void, errorHandler: () => void) => {
      const now = +new Date();

      const refreshToken = AppStorage.getItem(StorageKeys.REFRESH_TOKEN);
      const refreshTokenExpiry = AppStorage.getItem(StorageKeys.REFRESH_TOKEN_EXPIRY);

      if (refreshToken && refreshTokenExpiry && +refreshTokenExpiry > now) {
        // request to fetch the refreshed tokens
        const config = {
          endpoint: API_ENDPOINT.AUTH_REFRESH,
          method: 'POST',
          body: getAuthTokens(),
        };

        sendApiRequest(
          config,
          (result: KeycloakToken) => {
            storeAuthTokens(result);
            handler();
          },
          errorHandler,
        );
      }
    },
    [getAuthTokens, sendApiRequest, storeAuthTokens],
  );

  return {
    isAuthenticated,
    logMeIn,
    logMeOut,
    fetchAuthTokenFromCode,
    refreshAuthTokens,
  };
};
