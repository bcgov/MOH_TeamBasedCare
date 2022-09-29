/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpStatus, HttpException } from '@nestjs/common';
import { CommonError } from 'src/common/common.errors';

export class GenericError {
  /** Internal code */
  errorType!: string;

  /** User friendly message */
  errorMessage!: string;

  /** Default is Internal Server Error */
  httpStatus?: HttpStatus;
}

// tslint:disable-next-line: max-classes-per-file
export class GenericException extends HttpException {
  public originalError: any;

  constructor(error: GenericError, originalError?: any) {
    if (originalError && originalError.code === 'ECONNABORTED') {
      throw new GenericException(CommonError.GATEWAY_TIMEOUT);
    }

    const errorCode = error.httpStatus || HttpStatus.INTERNAL_SERVER_ERROR;

    super(
      {
        error: error.errorType,
        message: error.errorMessage || originalError?.message,
      },
      errorCode,
    );

    this.originalError = originalError;
  }
}
