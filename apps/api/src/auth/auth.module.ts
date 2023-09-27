import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule } from 'src/config/config.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [ConfigModule, HttpModule],
})
export class AuthModule {}
