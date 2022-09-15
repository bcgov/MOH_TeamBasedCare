import { NestFactory } from '@nestjs/core';
import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';

import { AppModule } from './app.module';
import { AppLogger } from './common/logger.service';
import { ErrorExceptionFilter } from './common/error-exception.filter';
import { TrimPipe } from './common/trim.pipe';
import { API_PREFIX } from './config';
import { Documentation } from './common/documentation';

interface ValidationErrorMessage {
  property: string;
  errors: string[];
}

export const validationPipeConfig: ValidationPipeOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: false,
  enableDebugMessages: false,
  disableErrorMessages: true,
  exceptionFactory: errors => {
    const getErrorMessages = (error: ValidationError): ValidationErrorMessage[] => {
      const messages: ValidationErrorMessage[] = [];
      if (error.constraints) {
        messages.push({
          property: error.property,
          errors: Object.values(error.constraints),
        });
      }
      if (error.children && error.children?.length > 0) {
        messages.push(...error.children.map(getErrorMessages).reduce((a, c) => a.concat(c), []));
      }
      return messages;
    };
    const errorMessages = errors.map(error => getErrorMessages(error));
    throw new BadRequestException(errorMessages);
  },
};

export async function createNestApp(): Promise<{
  app: NestExpressApplication;
  expressApp: express.Application;
}> {
  // Express app
  const expressApp = express();
  expressApp.disable('x-powered-by');

  // Nest Application With Express Adapter
  let app: NestExpressApplication;
  if (process.env.RUNTIME_ENV === 'local') {
    app = await NestFactory.create(AppModule, {
      logger: new AppLogger(),
    });
  } else {
    app = await NestFactory.create<NestExpressApplication>(
      AppModule,
      new ExpressAdapter(expressApp),
    );
    // Adding winston logger
    app.useLogger(new AppLogger());
  }

  // Api prefix api/v1/
  app.setGlobalPrefix(API_PREFIX);

  // Enabling Documentation
  Documentation(app);

  // Validation pipe
  app.useGlobalPipes(new TrimPipe(), new ValidationPipe(validationPipeConfig));

  // Global Error Filter
  app.useGlobalFilters(new ErrorExceptionFilter(app.get(AppLogger)));

  // Printing the environment variables
  // eslint-disable-next-line no-console
  console.table({
    project: process.env.PROJECT,
    envName: process.env.ENV_NAME,
    nodeEnv: process.env.NODE_ENV,
    runtimeEnv: process.env.RUNTIME_ENV,
    alertsEnabled: Boolean(false),
  });
  return {
    app,
    expressApp,
  };
}
