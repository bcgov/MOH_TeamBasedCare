import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getVersionInfo(): object {
    return {
      buildId: process.env.BUILD_ID ?? 'NA',
      info: process.env.BUILD_INFO ?? 'NA',
      env: process.env.ENV_NAME ?? 'NA',
    };
  }
}
