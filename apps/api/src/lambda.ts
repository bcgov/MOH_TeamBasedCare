import serverlessExpress from '@vendia/serverless-express';
import { Logger } from '@nestjs/common';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
  Callback,
  Handler,
} from 'aws-lambda';
import { createNestApp } from './app.config';
import bodyParser from 'body-parser';

let cachedServer: Handler;

async function bootstrap() {
  if (!cachedServer) {
    const logger = new Logger('Bootstrap');
    logger.log(`Node.js version: ${process.version}`);
    const { app: nestApp, expressApp } = await createNestApp();
    nestApp.use(bodyParser.json({ limit: '25mb' }));
    nestApp.use(bodyParser.urlencoded({ limit: '25mb', extended: true }));
    await nestApp.init();
    cachedServer = serverlessExpress({ app: expressApp });
  }
  return cachedServer;
}

export const handler: Handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback,
): Promise<APIGatewayProxyResult> => {
  const cachedServerHandler = await bootstrap();
  return cachedServerHandler(event, context, callback);
};
