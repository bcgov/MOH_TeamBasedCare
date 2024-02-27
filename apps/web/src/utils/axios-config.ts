import axios from 'axios';
import { AppStorage, StorageKeys } from './storage';
import { clearStorageAndRedirectToLandingPage, refreshAuthTokens } from './token';

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

AxiosPublic.interceptors.request.use(
  config => {
    const token = AppStorage.getItem(StorageKeys.ACCESS_TOKEN);
    if (token) {
      if (!config.headers) {
        config.headers = {};
      }

      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    Promise.reject(error);
  },
);

AxiosPublic.interceptors.response.use(
  response => handleResponseSuccess(response),
  async error => {
    const originalRequest = error.config;
    if (error?.response?.status === 401 && !originalRequest._retry) {
      // tag a retry
      originalRequest._retry = true;

      try {
        // refresh auth tokens
        const { isRefreshTokenExpired, accessToken } = await refreshAuthTokens();

        // if refresh token not already expired, retry call
        if (!isRefreshTokenExpired) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          return AxiosPublic(originalRequest);
        }
      } catch (e) {
        // if refreshing auth token fails
        originalRequest._isException = true;
      }
    }

    // if retried and it still failed, log out and redirect to the landing page
    if ((originalRequest._retry || originalRequest._isException) && typeof window !== 'undefined') {
      clearStorageAndRedirectToLandingPage();
    }

    // reject otherwise
    return Promise.reject(error);
  },
);
