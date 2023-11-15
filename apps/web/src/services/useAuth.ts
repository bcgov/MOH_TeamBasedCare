import { useHttp } from '@services';
import { KeycloakToken, KeycloakUser, Role } from '@tbcm/common';
import { useCallback, useMemo } from 'react';
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

    const accessToken = AppStorage.getItem(StorageKeys.ACCESS_TOKEN);
    const accessTokenExpiry = AppStorage.getItem(StorageKeys.ACCESS_TOKEN_EXPIRY);

    const refreshToken = AppStorage.getItem(StorageKeys.REFRESH_TOKEN);
    const refreshTokenExpiry = AppStorage.getItem(StorageKeys.REFRESH_TOKEN_EXPIRY);

    const username = AppStorage.getItem(StorageKeys.USERNAME);

    // both tokens exist, and not expired
    if (
      accessToken &&
      accessTokenExpiry &&
      +accessTokenExpiry > now &&
      refreshToken &&
      refreshTokenExpiry &&
      +refreshTokenExpiry > now &&
      username
    ) {
      return true;
    }

    return false;
  }, []);

  // store user data to the storage
  const storeUserData = useCallback((data: KeycloakUser) => {
    AppStorage.setItem(StorageKeys.USERNAME, data.preferred_username);
    AppStorage.setItem(StorageKeys.DISPLAY_NAME, data.name);
    AppStorage.setItem(StorageKeys.ROLES, data.resource_access?.TBCM?.roles || []);
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
    (handler: () => void, errorToastMessage?: string) => {
      const config = { endpoint: API_ENDPOINT.AUTH_USER };

      fetchData(
        config,
        (result: KeycloakUser) => {
          // update user to storage
          storeUserData(result);

          // call success handler
          handler();
        },
        errorToastMessage,
      );
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

      // execute this handler under either cases - success/failure
      // clear storage and redirect user to landing page
      const commonHandler = () => {
        clearStorageAndRedirectToLandingPage();
      };

      // send logout request
      sendApiRequest(
        config,
        () => {
          commonHandler();
          handler?.();
        },
        () => {
          commonHandler();
          errorHandler?.();
        },
      );
    },
    [sendApiRequest],
  );

  const userRoles = useMemo(() => {
    return AppStorage.getItem(StorageKeys.ROLES) as Role[];
  }, []);

  return {
    isAuthenticated,
    logMeIn,
    logMeOut,
    fetchAuthTokenFromCode,
    fetchUserFromCode,
    userRoles,
  };
};
