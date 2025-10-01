import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;
    this.logger.log(`Method: ${method}`);
    this.logger.log(`URL: ${url}`);
    this.logger.log(`Content-Type: ${headers['content-type']}`);
    if (body) {
      this.logger.log(`Body Type: ${typeof body}`);
      if (body.job_location) {
        this.logger.log(`job_location type: ${typeof body.job_location}`);
        this.logger.log(`job_location value: ${JSON.stringify(body.job_location)}`);
      }
      try {
        this.logger.log(JSON.stringify(body));
      } catch (error) {
        this.logger.log(`Error logging body: ${error}`);
      }
    } else {
      this.logger.log('No Body');
    }
    return next.handle();
  }
}
