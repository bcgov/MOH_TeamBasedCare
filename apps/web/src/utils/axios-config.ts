import axios from 'axios';

export const AxiosPublic = axios.create({
  headers: {
    Accept: 'application/json',
    'Content-type': 'application/json',
  },
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

const handleResponseSuccess = (response: any) => {
  return response?.data;
};

AxiosPublic.interceptors.response.use(
  response => handleResponseSuccess(response),
  error => {
    return Promise.reject(error);
  },
);
