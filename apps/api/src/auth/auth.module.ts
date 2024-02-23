import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule } from 'src/config/config.module';
import { UserModule } from 'src/user/user.module';
import { JwtService } from './jwt.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService],
  exports: [AuthService, JwtService],
  imports: [ConfigModule, HttpModule, UserModule],
})
export class AuthModule {}
