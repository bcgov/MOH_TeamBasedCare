import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllowedActivity } from './entity/allowed-activity.entity';
import { AllowedActivityController } from './allowed-activity.controller';
import { AllowedActivityService } from './allowed-activity.service';
import { CareActivityModule } from 'src/care-activity/care-activity.module';
import { OccupationModule } from 'src/occupation/occupation.module';

@Module({
  imports: [TypeOrmModule.forFeature([AllowedActivity]), CareActivityModule, OccupationModule],
  exports: [AllowedActivityService],
  controllers: [AllowedActivityController],
  providers: [AllowedActivityService],
})
export class AllowedActivityModule {}
