/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { CommonError } from 'src/common/common.errors';
import { FailedResponse } from './ro/failed-response.ro';

@Catch(Error)
export class ErrorExceptionFilter implements ExceptionFilter {
  constructor(@Inject(Logger) private readonly logger: Logger) {}

  /**
   * Transform a generic thrown exception to a `FailedResponse`
   *
   * @param exception: An exception caught by the handler
   * @returns A failed response object
   */
  transformHttpException(exception: Error): FailedResponse {
    const exceptionMessage: any = exception.message;

    return {
      errorType:
        exceptionMessage?.error ||
        (exception as any).response?.error ||
        CommonError.INTERNAL_ERROR.errorType,

      errorMessage:
        exceptionMessage?.message ||
        (exception as any)?.response?.message ||
        CommonError.INTERNAL_ERROR.errorMessage,

      errorDetails: {},
    };
  }

  /**
   * This method is called when an exception is thrown anywhere in the application
   * It parses and transforms the exception data and sends it to the logger and to the client
   */
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const request = ctx.getRequest();
    /** Flat error if it was wrapped inside another error */
    const flattenedException =
      typeof exception?.message === 'object' &&
      typeof (exception?.message as any)?.message === 'object'
        ? exception?.message
        : exception;

    const privateKeys: string[] = ['password', 'payload'];
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    privateKeys.forEach(key => {
      if (body[key]) {
        delete body[key];
      }
    });

    // Log errors
    this.logger.error(flattenedException, 'ExceptionFilter');

    response.status(status).json(this.transformHttpException(flattenedException));
  }
}
