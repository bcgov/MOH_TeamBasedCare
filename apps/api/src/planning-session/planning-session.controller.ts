import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SaveProfileDTO } from '@tbcm/common';
import { SUCCESS_RESPONSE } from '../common/constants';
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

  @Post('/:sessionId/profile')
  saveCurrentProfileSelection(
    @Param('sessionId') sessionId: string,
    @Body() saveProfileDto: SaveProfileDTO,
  ) {
    this.planningSessionService.saveProfileSelection(sessionId, saveProfileDto);
    return SUCCESS_RESPONSE;
  }

  @Get('/:sessionId/profile')
  getCurrentProfileSelection(@Param('sessionId') sessionId: string) {
    return this.planningSessionService.getProfileSelection(sessionId);
  }
}
