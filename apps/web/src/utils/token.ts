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
  // fetch environment
  const isTest = isTestEnv();

  // clear all app storage
  AppStorage.clear();

  // Extract redirectUri
  let redirectUri = '/';
  if (typeof window != 'undefined') redirectUri = window.location.origin;

  // logout URLs
  const logoutUrl = `https://logon7.gov.bc.ca/clp-cgi/logoff.cgi?retnow=1&returl=${redirectUri}`;
  const testLogoutUrl = `https://logontest7.gov.bc.ca/clp-cgi/logoff.cgi?retnow=1&returl=${redirectUri}`;

  // redirect and logout
  if (typeof window != 'undefined') window.location.href = isTest ? testLogoutUrl : logoutUrl;
};

export const isTestEnv = () => {
  try {
    const token: string = AppStorage.getItem(StorageKeys.ACCESS_TOKEN);
    const payload = JSON.parse(window.atob(token.split('.')[1]));
    if (payload.iss?.includes('common-logon-test')) return true;
  } catch (e) {}

  return false;
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
