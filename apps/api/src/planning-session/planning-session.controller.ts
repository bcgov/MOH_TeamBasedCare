import { Body, ClassSerializerInterceptor, Controller, Get, Param, Patch, Post, UseInterceptors } from '@nestjs/common';
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
  async saveCurrentProfileSelection(
    @Param('sessionId') sessionId: string,
    @Body() saveProfileDto: SaveProfileDTO,
  ) {
    await this.planningSessionService.saveProfileSelection(sessionId, saveProfileDto);
    return SUCCESS_RESPONSE;
  }

  @Get('/:sessionId/profile')
  getCurrentProfileSelection(@Param('sessionId') sessionId: string) {
    return this.planningSessionService.getProfileSelection(sessionId);
  }

  @Get('/:sessionId/care-activity/bundle')
  @UseInterceptors(ClassSerializerInterceptor)
  getBundlesForProfile(@Param('sessionId') sessionId: string) {
    return this.planningSessionService.getBundlesForSelectedCareLocation(sessionId);
  }

  @Patch('/:sessionId/care-activity')
  @ApiBody({ type: SaveCareActivityDTO })
  async saveCareActivity(
    @Param('sessionId') sessionId: string,
    @Body() careActivityDto: SaveCareActivityDTO,
  ) {
    await this.planningSessionService.saveCareActivity(sessionId, careActivityDto);
    return SUCCESS_RESPONSE;
  }

  @Get('/:sessionId/care-activity')
  getCareActivity(@Param('sessionId') sessionId: string) {
    return this.planningSessionService.getCareActivity(sessionId);
  }

  @Patch('/:sessionId/occupation')
  @ApiBody({ type: SaveOccupationDTO })
  async saveOccupation(
    @Param('sessionId') sessionId: string,
    @Body() occupationDto: SaveOccupationDTO,
  ) {
    await this.planningSessionService.saveOccupation(sessionId, occupationDto);
    return SUCCESS_RESPONSE;
  }

  @Get('/:sessionId/occupation')
  getOccupation(@Param('sessionId') sessionId: string) {
    return this.planningSessionService.getOccupation(sessionId);
  }

  @Get('/:sessionId/activities-gap')
  getPlanningActivityGap(@Param('sessionId') sessionId: string) {
    return this.planningSessionService.getPlanningActivityGap(sessionId);
  }

  @Post('/:sessionId/export-csv')
  exportCsv(@Param('sessionId') sessionId: string) {
    return this.planningSessionService.exportCsv(sessionId);
  }
}
