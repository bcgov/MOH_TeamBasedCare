import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlanningSession } from './entity/planning-session.entity';
import { PlanningSessionService } from './planning-session.service';

@ApiTags('session')
@Controller('sessions')
export class PlanningSessionController {
  constructor(private planningSessionService: PlanningSessionService) {}
  @Post()
  createPlanningSession(): Promise<PlanningSession> {
    return this.planningSessionService.createPlanningSession();
  }
}
