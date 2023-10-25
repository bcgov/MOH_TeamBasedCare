import { HttpStatus } from '@nestjs/common';
import { GenericError } from 'src/common/generic-exception';

export const CommonError = {
  INTERNAL_ERROR: {
    errorType: 'INTERNAL_ERROR',
    errorMessage: 'Internal Server Error',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
  } as GenericError,

  FAILED_FIELD_VALIDATION: {
    errorType: 'FAILED_FIELD_VALIDATION',
    errorMessage: 'Some fields were rejected. Please, check your information and try again.',
    httpStatus: HttpStatus.PRECONDITION_FAILED,
  } as GenericError,

  GATEWAY_TIMEOUT: {
    errorType: 'GATEWAY_TIMEOUT',
    errorMessage: 'Gateway Timeout',
    httpStatus: HttpStatus.GATEWAY_TIMEOUT,
  } as GenericError,
};
