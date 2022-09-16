import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanningSession } from './entity/planning-session.entity';
import { PlanningSessionController } from './planning-session.controller';
import { PlanningSessionService } from './planning-session.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlanningSession])],
  exports: [],
  controllers: [PlanningSessionController],
  providers: [PlanningSessionService],
})
export class PlanningSessionModule {}
