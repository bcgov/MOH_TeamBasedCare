import { useHttp } from '@services';
import { KeycloakToken, UserRO } from '@tbcm/common';
import { useCallback } from 'react';
import { API_ENDPOINT, REQUEST_METHOD } from 'src/common';
import {
  clearStorageAndRedirectToLandingPage,
  getAuthTokens,
  storeAuthTokens,
} from 'src/utils/token';
import { AppStorage, StorageKeys } from '../utils/storage';

export const useAuth = () => {
  const { sendApiRequest, fetchData } = useHttp();

  // soft check if the user is authenticated
  const isAuthenticated = useCallback(() => {
    const now = +new Date();

    const refreshToken = AppStorage.getItem(StorageKeys.REFRESH_TOKEN);
    const refreshTokenExpiry = AppStorage.getItem(StorageKeys.REFRESH_TOKEN_EXPIRY);

    const email = AppStorage.getItem(StorageKeys.EMAIL);

    // both tokens exist, and not expired
    if (refreshToken && refreshTokenExpiry && +refreshTokenExpiry > now && email) {
      return true;
    }

    return false;
  }, []);

  // store user data to the storage
  const storeUserData = useCallback((data: UserRO) => {
    AppStorage.setItem(StorageKeys.ID, data.id);
    AppStorage.setItem(StorageKeys.EMAIL, data.id);
  }, []);

  // fetch authentication token from authorization code
  const fetchAuthTokenFromCode = useCallback(
    (code: string, handler: () => void, errorHandler: () => void, errorToastMessage?: string) => {
      const config = {
        endpoint: API_ENDPOINT.AUTH_CALLBACK,
        method: REQUEST_METHOD.POST,
        data: { code },
      };
      // fetch token from code
      sendApiRequest(
        config,
        (result: KeycloakToken) => {
          // update tokens to storage
          storeAuthTokens(result);

          // call success handler
          handler();
        },
        errorHandler,
        errorToastMessage,
      );
    },
    [sendApiRequest],
  );

  // fetch user information from authentication token
  const fetchUserFromCode = useCallback(
    (handler: () => void, errorHandler: () => void, errorToastMessage?: string) => {
      const config = { endpoint: API_ENDPOINT.AUTH_USER };

      const userHandler = (user: UserRO) => {
        // update user to storage
        storeUserData(user);

        // call success handler
        handler();
      };

      // else fetch from the endpoint
      fetchData(config, userHandler, errorToastMessage, errorHandler);
    },
    [fetchData, storeUserData],
  );

  // redirect user to auth provider login
  const logMeIn = useCallback(() => {
    if (typeof window === 'undefined') return;

    window.location.href = process.env.NEXT_PUBLIC_API_URL + API_ENDPOINT.AUTH_LOGIN;
  }, []);

  // log users out and redirect to the Landing page; Also, clear storage
  const logMeOut = useCallback(
    (handler?: () => void, errorHandler?: () => void) => {
      const config = {
        endpoint: API_ENDPOINT.AUTH_LOGOUT,
        method: REQUEST_METHOD.POST,
        data: getAuthTokens(),
      };

      // send logout request
      sendApiRequest(
        config,
        () => {
          clearStorageAndRedirectToLandingPage();
          handler?.();
        },
        () => {
          errorHandler?.();
        },
      );
    },
    [sendApiRequest],
  );

  return {
    isAuthenticated,
    logMeIn,
    logMeOut,
    fetchAuthTokenFromCode,
    fetchUserFromCode,
  };
};
