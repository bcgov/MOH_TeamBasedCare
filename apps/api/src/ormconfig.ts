import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { DatabaseNamingStrategy } from './database/database.naming-strategy';
import DatabaseLogger from './database/database-logger';
import { join } from 'path';

dotenv.config();
// Check typeORM documentation for more information.

export const config: PostgresConnectionOptions = {
  host: process.env.POSTGRES_HOST,
  type: 'postgres',
  port: +(process.env.PORTGRES_PORT || 5432),
  username: process.env.POSTGRES_USERNAME || 'freshworks',
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE || 'tbcm',
  entities: [join(__dirname, '/**/*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migration/*.{ts,js}')],
  subscribers: ['dist/**/*.subscriber.js'],
  synchronize: false,
  migrationsRun: true,
  namingStrategy: new DatabaseNamingStrategy(),
  logging: !!process.env.DEBUG,
  logger: process.env.DEBUG ? new DatabaseLogger() : undefined,
};

export default new DataSource(config);
