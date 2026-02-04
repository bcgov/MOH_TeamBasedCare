import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RequestTransformInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestTransformInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { body } = request;
    if (body) {
      this.logger.log(`Incoming body Type: ${typeof body}`);
      if (Buffer.isBuffer(body)) {
        this.logger.log(`Attempting to parse incoming message body`);
        try {
          //Convert buffer to string
          const jsonString = body.toString('utf8');
          //Parse string to object
          const jsonObject = JSON.parse(jsonString);
          //Replace message body with parsed object
          request.body = jsonObject;
        } catch (error) {
          this.logger.log(`Error parsing body: ${error}`);
        }
      }
    }
    return next.handle();
  }
}
