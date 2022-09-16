import { Injectable } from '@nestjs/common';
import { SeedService } from './database/scripts/seed-service';

@Injectable()
export class AppService {
  constructor(private readonly seedService: SeedService) {}

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
}
