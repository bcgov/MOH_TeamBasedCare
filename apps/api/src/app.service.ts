import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { SeedService } from './database/scripts/seed-service';

@Injectable()
export class AppService {
  constructor(
    private readonly seedService: SeedService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  getVersionInfo(): object {
    return {
      buildId: process.env.BUILD_ID ?? 'NA',
      info: process.env.BUILD_INFO ?? 'NA',
      env: process.env.ENV_NAME ?? 'NA',
    };
  }

  async updateCareActivities(file: Buffer) {
    await this.seedService.updateCareActivities(file);
  }

  async updateOccupations(file: Buffer) {
    await this.seedService.updateOccupations(file);
  }

  async pruneData() {
    return this.connection.query(`
      delete from allowed_activity;
      delete from care_activity;
      delete from bundle;
      delete from planning_session;
      delete from unit;
    `);
  }
}
