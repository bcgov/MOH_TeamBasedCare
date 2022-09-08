import { HttpStatus } from '@nestjs/common';
import { GenericError } from './generic-exception';

export const getGenericError = (error: any): GenericError => {
  const customError = {
    errorType: error?.response?.statusText || error?.message || 'INTERNAL_SERVER_ERROR',
    errorMessage:
      error?.response?.data?.message ?? error?.response?.data ?? 'Internal server error',
    httpStatus: error?.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
  };
  return customError;
};

/**
 *
 * @param text Input text to be cleaned
 * @returns input text in lowercase with only alphanumeric chars
 */
export const cleanText = (text: string): string => {
  const regex = /\W/gm;
  return text.toLowerCase().replace(regex, '');
};
