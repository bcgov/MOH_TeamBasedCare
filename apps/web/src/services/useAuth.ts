import { useHttp } from '@services';
import { KeycloakToken, Role, UserRO, UserStatus } from '@tbcm/common';
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
    AppStorage.setItem(StorageKeys.EMAIL, data.email);
    AppStorage.setItem(StorageKeys.DISPLAY_NAME, data.displayName);
    AppStorage.setItem(StorageKeys.ROLES, data.roles || []);
    AppStorage.setItem(StorageKeys.STATUS, data.status);
    AppStorage.setItem(StorageKeys.ID, data.id);
    AppStorage.setItem(StorageKeys.USER_PREFERENCE, data.userPreference);
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

  const userRoles = useMemo(() => {
    return AppStorage.getItem(StorageKeys.ROLES) as Role[];
  }, []);

  const userStatus = useMemo(() => {
    return AppStorage.getItem(StorageKeys.STATUS) as UserStatus;
  }, []);

  const userId = useMemo(() => {
    return AppStorage.getItem(StorageKeys.ID) as string;
  }, []);

  const hasUserRole = useCallback(
    (roles: Role[]) => {
      if (!Array.isArray(roles) || !Array.isArray(userRoles)) return false;

      return userRoles.some(role => roles.includes(role));
    },
    [userRoles],
  );

  const isLoggedInUser = useCallback(
    (user: UserRO) => {
      return user.id === userId;
    },
    [userId],
  );

  return {
    isAuthenticated,
    logMeIn,
    logMeOut,
    fetchAuthTokenFromCode,
    fetchUserFromCode,
    userRoles,
    userStatus,
    userId,
    hasUserRole,
    isLoggedInUser,
  };
};
