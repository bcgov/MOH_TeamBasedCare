import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitModule } from 'src/unit/unit.module';
import { CareActivityModule } from '../care-activity/care-activity.module';
import { AllowedActivity } from 'src/allowed-activity/entity/allowed-activity.entity';
import { OccupationModule } from '../occupation/occupation.module';
import { PlanningSession } from './entity/planning-session.entity';
import { PlanningSessionController } from './planning-session.controller';
import { PlanningSessionService } from './planning-session.service';
import { PlanningSessionSubscriber } from './subscribers/planning-session.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlanningSession, AllowedActivity]),
    CareActivityModule,
    OccupationModule,
    UnitModule,
  ],
  exports: [],
  controllers: [PlanningSessionController],
  providers: [PlanningSessionService, PlanningSessionSubscriber],
})
export class PlanningSessionModule {}
