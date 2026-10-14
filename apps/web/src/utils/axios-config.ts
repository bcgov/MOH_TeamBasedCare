import axios from 'axios';
import { AppStorage, StorageKeys } from './storage';
import {
  refreshAuthTokens,
  clearAuthAndRedirectToLogin,
  isAccessTokenExpired,
  isRefreshTokenExpired,
} from './token';
import { API_ENDPOINT } from 'src/common';

export const AxiosPublic = axios.create({
  headers: {
    Accept: 'application/json',
    'Content-type': 'application/json',
  },
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

const handleResponseSuccess = (response: any) => {
  return response;
};

// Share token refresh across simultaneous requests.
let inFlightRefresh: Promise<string | null> | null = null;

const isAuthBootstrapUrl = (url?: string) => {
  if (!url) return false;
  return (
    url.includes(API_ENDPOINT.AUTH_LOGIN) ||
    url.includes(API_ENDPOINT.AUTH_CALLBACK) ||
    url.includes(API_ENDPOINT.AUTH_REFRESH)
  );
};

AxiosPublic.interceptors.request.use(
  async config => {
    // do not try to attach/refresh for auth bootstrap endpoints
    if (isAuthBootstrapUrl(String(config.url))) return config;

    // if access token missing or expired, try to refresh first
    try {
      const accessExpired = isAccessTokenExpired();

      if (accessExpired) {
        // if refresh already in-flight, wait for it
        if (inFlightRefresh) {
          const newToken = await inFlightRefresh;
          if (newToken) config.headers.set('Authorization', `Bearer ${newToken}`);
          return config;
        }

        // if refresh token expired, bail out and redirect to login
        if (isRefreshTokenExpired()) {
          clearAuthAndRedirectToLogin();
          return Promise.reject({ message: 'refresh expired', _isAuthExpired: true });
        }

        // start refresh flow
        inFlightRefresh = (async () => {
          try {
            const { isRefreshTokenExpired, accessToken } = await refreshAuthTokens();
            if (!isRefreshTokenExpired && accessToken) return accessToken;
            return null;
          } catch (e) {
            return null;
          }
        })();

        const newAccess = await inFlightRefresh;
        inFlightRefresh = null;

        if (!newAccess) {
          // refresh failed
          clearAuthAndRedirectToLogin();
          return Promise.reject({ message: 'failed to refresh', _isAuthExpired: true });
        }

        config.headers.set('Authorization', `Bearer ${newAccess}`);

        return config;
      }

      // attach existing token if present and not expired
      const token = AppStorage.getItem(StorageKeys.ACCESS_TOKEN);
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }

      return config;
    } catch (e) {
      // on unexpected failures, let request proceed (response interceptor handles 401)
      return config;
    }
  },
  error => {
    return Promise.reject(error);
  },
);

AxiosPublic.interceptors.response.use(
  response => handleResponseSuccess(response),
  async error => {
    const originalRequest = error.config || {};

    // fallback: if server returns 401 and the request wasn't retried already, try refresh+retry
    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // try refresh
        const { isRefreshTokenExpired, accessToken } = await refreshAuthTokens();

        if (!isRefreshTokenExpired && accessToken) {
          originalRequest.headers.set('Authorization', `Bearer ${accessToken}`);
          return AxiosPublic(originalRequest);
        }
      } catch (e) {
        originalRequest._isException = true;
      }
    }

    // if retried or refresh failed, clear storage and redirect to login
    if ((originalRequest._retry || originalRequest._isException) && typeof window !== 'undefined') {
      // use login redirect (not full Common Logon logout) for expired sessions
      clearAuthAndRedirectToLogin();
    }

    return Promise.reject(error);
  },
);
