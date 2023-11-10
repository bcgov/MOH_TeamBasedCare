import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

import { LoggerOptions } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { AllowedActivity } from 'src/allowed-activity/entity/allowed-activity.entity';
import { Bundle } from '../care-activity/entity/bundle.entity';
import { CareActivity } from '../care-activity/entity/care-activity.entity';
import { Occupation } from 'src/occupation/entity/occupation.entity';

import config from '../ormconfig';
import { Unit } from '../unit/entity/unit.entity';
import { SeedService } from './scripts/seed-service';
import { UnitModule } from 'src/unit/unit.module';

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
  migrationsRun: true,
  synchronize: false,
};

@Module({
  imports: [
    TypeOrmModule.forRoot(appOrmConfig),
    TypeOrmModule.forFeature([CareActivity, Occupation, AllowedActivity, Unit, Bundle]),
    UnitModule,
  ],
  providers: [Logger, SeedService],
  exports: [SeedService, TypeOrmModule],
})
export class DatabaseModule {}
