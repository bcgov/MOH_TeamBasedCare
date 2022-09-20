import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { SaveCareActivityDTO, SaveOccupationDTO, SaveProfileDTO } from '@tbcm/common';
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

  @Patch('/:sessionId/profile')
  @ApiBody({ type: SaveProfileDTO })
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

  @Patch('/:sessionId/care-activity')
  @ApiBody({ type: SaveCareActivityDTO })
  saveCareActivity(
    @Param('sessionId') sessionId: string,
    @Body() careActivityDto: SaveCareActivityDTO,
  ) {
    this.planningSessionService.saveCareActivity(sessionId, careActivityDto);
    return SUCCESS_RESPONSE;
  }

  @Get('/:sessionId/care-activity')
  getCareActivity(@Param('sessionId') sessionId: string) {
    return this.planningSessionService.getCareActivity(sessionId);
  }

  @Patch('/:sessionId/occupation')
  @ApiBody({ type: SaveOccupationDTO })
  saveOccupation(@Param('sessionId') sessionId: string, @Body() occupationDto: SaveOccupationDTO) {
    this.planningSessionService.saveOccupation(sessionId, occupationDto);
    return SUCCESS_RESPONSE;
  }

  @Get('/:sessionId/occupation')
  getOccupation(@Param('sessionId') sessionId: string) {
    return this.planningSessionService.getOccupation(sessionId);
  }
}
