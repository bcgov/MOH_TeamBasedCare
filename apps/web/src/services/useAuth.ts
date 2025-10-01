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

      // Debug logging for AWS environment
      const isAWS =
        typeof window !== 'undefined' && !window.location.hostname.includes('localhost');

      if (isAWS) {
        // eslint-disable-next-line no-console
        console.log('🔑 Fetching auth token from callback:', {
          endpoint: config.endpoint,
          codeLength: code?.length || 0,
          codePreview: code?.substring(0, 20) + '...',
        });
      }

      // fetch token from code
      sendApiRequest(
        config,
        (result: KeycloakToken) => {
          if (isAWS) {
            // eslint-disable-next-line no-console
            console.log('📥 Auth callback response:', {
              hasResult: !!result,
              resultType: typeof result,
              hasAccessToken: !!result?.access_token,
              hasRefreshToken: !!result?.refresh_token,
              accessTokenLength: result?.access_token?.length || 0,
              refreshTokenLength: result?.refresh_token?.length || 0,
              expiresIn: result?.expires_in,
              fullResult: result,
            });
          }

          if (!result || !result.access_token) {
            if (isAWS) {
              // eslint-disable-next-line no-console
              console.error('❌ Invalid auth callback response - no access token found');
            }
            errorHandler();
            return;
          }

          // update tokens to storage
          storeAuthTokens(result);

          // call success handler
          handler();
        },
        () => {
          if (isAWS) {
            // eslint-disable-next-line no-console
            console.error('❌ Auth callback request failed');
          }
          errorHandler();
        },
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
