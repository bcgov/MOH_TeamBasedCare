import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserSubscriber } from './subscribers/user.subscriber';
import { UserPreferenceSubscriber } from './subscribers/user-preference.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, UserSubscriber, UserPreferenceSubscriber],
})
export class UserModule {}
