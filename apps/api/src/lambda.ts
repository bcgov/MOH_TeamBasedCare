import serverlessExpress from '@vendia/serverless-express';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
  Callback,
  Handler,
} from 'aws-lambda';
import { createNestApp } from './app.config';

let cachedServer: Handler;

async function bootstrap() {
  if (!cachedServer) {
    const { app: nestApp, expressApp } = await createNestApp();
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
