import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeedService } from './database/scripts/seed-service';
import { Bundle } from './entities/bundle.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Bundle)
    private readonly bundleRepo: Repository<Bundle>,
    private readonly seedService: SeedService,
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
}
