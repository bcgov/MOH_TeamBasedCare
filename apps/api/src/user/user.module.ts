import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserSubscriber } from './subscribers/user.subscriber';
import { UserPreferenceSubscriber } from './subscribers/user-preference.subscriber';
import { UserPreference } from './entities/user-preference.entity';
@Module({
  imports: [TypeOrmModule.forFeature([User, UserPreference])],
  controllers: [UserController],
  providers: [UserService, UserSubscriber, UserPreferenceSubscriber],
  exports: [UserService],
})
export class UserModule {}
