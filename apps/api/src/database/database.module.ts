import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

import { LoggerOptions } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import config from '../ormconfig';

const getEnvironmentSpecificConfig = (env?: string) => {
  switch (env) {
    case 'production':
      return {
        entities: [join(__dirname, '../**/*.entity.js')],
        migrations: [join(__dirname, '../migration/*.js')],
        logging: ['migration'] as LoggerOptions,
      };
    case 'test':
      return {
        port: parseInt(process.env.TEST_POSTGRES_PORT || '5432'),
        host: process.env.TEST_POSTGRES_HOST,
        username: process.env.TEST_POSTGRES_USERNAME,
        password: process.env.TEST_POSTGRES_PASSWORD,
        database: process.env.TEST_POSTGRES_DATABASE,
        entities: ['dist/**/*.entity.js'],
        migrations: ['dist/migration/*.js'],
        logging: ['error', 'warn', 'migration'] as LoggerOptions,
      };
    default:
      return {
        entities: ['dist/**/*.entity.js'],
        migrations: ['dist/migration/*.js'],
        logging: ['error', 'warn', 'migration'] as LoggerOptions,
      };
  }
};

const nodeEnv = process.env.NODE_ENV;
const environmentSpecificConfig = getEnvironmentSpecificConfig(nodeEnv);

const appOrmConfig: PostgresConnectionOptions = {
  ...config,
  ...environmentSpecificConfig,
  synchronize: false,
  migrationsRun: true,
};

@Module({
  imports: [TypeOrmModule.forRoot(appOrmConfig)],
  providers: [Logger],
})
export class DatabaseModule {}
