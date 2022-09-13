import { Controller } from '@nestjs/common';
import { PlanningSessionService } from './planning-session.service';

@Controller('sessions')
export class PlanningSessionController {
  constructor(private unitService: PlanningSessionService) {}
}
