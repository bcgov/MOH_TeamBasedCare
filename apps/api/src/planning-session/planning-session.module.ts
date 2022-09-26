import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareActivityModule } from '../care-activity/care-activity.module';
import { AllowedActivity } from '../entities/allowed-activities.entity';
import { OccupationModule } from '../occupation/occupation.module';
import { PlanningSession } from './entity/planning-session.entity';
import { PlanningSessionController } from './planning-session.controller';
import { PlanningSessionService } from './planning-session.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlanningSession, AllowedActivity]),
    CareActivityModule,
    OccupationModule,
  ],
  exports: [],
  controllers: [PlanningSessionController],
  providers: [PlanningSessionService],
})
export class PlanningSessionModule {}
