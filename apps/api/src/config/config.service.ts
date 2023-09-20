import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class ConfigService {
  getValue(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`config error - missing env.${key}`);
    }

    return value;
  }
}
