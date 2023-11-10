import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllowedActivity } from './entity/allowed-activity.entity';
import { AllowedActivityController } from './allowed-activity.controller';
import { AllowedActivityService } from './allowed-activity.service';

@Module({
  imports: [TypeOrmModule.forFeature([AllowedActivity])],
  exports: [AllowedActivityService],
  controllers: [AllowedActivityController],
  providers: [AllowedActivityService],
})
export class AllowedActivityModule {}
