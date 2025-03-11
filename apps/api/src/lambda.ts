import serverlessExpress from '@vendia/serverless-express';
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
