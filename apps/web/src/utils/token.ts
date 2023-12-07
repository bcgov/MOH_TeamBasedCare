import { AppTokensDTO, KeycloakToken } from '@tbcm/common';
import { API_ENDPOINT, REQUEST_METHOD } from 'src/common';
import { AxiosPublic } from './axios-config';
import { AppStorage, StorageKeys } from './storage';

export const storeAuthTokens = (data: KeycloakToken) => {
  const now = Date.now();

  AppStorage.setItem(StorageKeys.ACCESS_TOKEN, data.access_token);
  AppStorage.setItem(StorageKeys.ACCESS_TOKEN_EXPIRY, now + +data.expires_in * 1000);
  AppStorage.setItem(StorageKeys.REFRESH_TOKEN, data.refresh_token);
  AppStorage.setItem(StorageKeys.REFRESH_TOKEN_EXPIRY, now + +data.refresh_expires_in * 1000);
  AppStorage.setItem(StorageKeys.TOKENS_LAST_REFRESHED_AT, +now);
};

export const getAuthTokens = (): AppTokensDTO => {
  return {
    access_token: AppStorage.getItem(StorageKeys.ACCESS_TOKEN) || '',
    refresh_token: AppStorage.getItem(StorageKeys.REFRESH_TOKEN) || '',
  };
};

export const clearStorageAndRedirectToLandingPage = () => {
  const accessToken = getAuthTokens().access_token;
  const origin = window.location.origin;
  AppStorage.clear();

  // const url =
  //   'https://common-logon-test.hlth.gov.bc.ca/auth/realms/moh_applications/protocol/openid-connect/logout?id_token_hint=' +
  //   accessToken +
  //   '&post_logout_redirect_uri=' +
  //   origin;
  // if (typeof window != 'undefined') window.location.href = '/';
};

export const refreshAuthTokens = async () => {
  const response = {
    isRefreshTokenExpired: true,
    accessToken: '',
  };

  const now = +new Date();

  const refreshToken = AppStorage.getItem(StorageKeys.REFRESH_TOKEN);
  const refreshTokenExpiry = AppStorage.getItem(StorageKeys.REFRESH_TOKEN_EXPIRY);

  if (refreshToken && refreshTokenExpiry && +refreshTokenExpiry > now) {
    response.isRefreshTokenExpired = false;

    // request to fetch the refreshed tokens
    const config = {
      endpoint: API_ENDPOINT.AUTH_REFRESH,
      method: REQUEST_METHOD.POST,
      data: getAuthTokens(),
    };

    const { data }: { data: KeycloakToken } = await AxiosPublic(API_ENDPOINT.AUTH_REFRESH, config);

    storeAuthTokens(data);

    response.accessToken = data?.access_token;
  }

  return response;
};
