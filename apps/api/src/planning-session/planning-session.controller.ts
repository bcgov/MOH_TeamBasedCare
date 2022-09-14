import { Controller, Post } from '@nestjs/common';
import { PlanningSession } from './entity/planning-session.entity';
import { PlanningSessionService } from './planning-session.service';

@Controller('sessions')
export class PlanningSessionController {
  constructor(private planningSessionService: PlanningSessionService) {}
  @Post()
  createPlanningSession(): Promise<PlanningSession> {
    return this.planningSessionService.createPlanningSession();
  }
}
