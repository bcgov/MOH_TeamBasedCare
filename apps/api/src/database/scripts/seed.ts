import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { AppLogger } from '../../common/logger.service';
import { getGenericError } from '../../common/utils';
import { SeedService } from './seed-service';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Seeds the database with entries for testing purposes.
 */

const node_env = process.env.NODE_ENV;
(async () => {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const logger: AppLogger = appContext.get(Logger);

  logger.log('Seeding script started');

  // Initialize database connection
  await appContext.init();

  try {
    if (node_env === 'development' || node_env === 'test') {
      const seeder = appContext.get(SeedService);
      switch (process.env.SEED_TYPE) {
        case 'SEED_CARE_ACTIVITIES':
          const path = process.env.npm_config_path;
          if (!path) {
            logger.error(
              'Path to csv file not provided. use npm run db:seed-care-activities --path="./path/to/file.csv"',
            );
            break;
          }
          const fileBuffer = fs.readFileSync(path);
          await seeder.updateCareActivities(fileBuffer);
          break;
        default:
          throw new Error('Seed type not configured');
      }
      logger.log('Seeding complete');
    } else {
      throw new Error(
        'These seeding scripts are as of now configured only for test and development. When disabling this check make sure everything is taken care',
      );
    }
  } catch (e) {
    logger.error(getGenericError(e), 'Failed to seed data');
    throw e;
  } finally {
    appContext.close();
  }
})();

module.exports = {};
