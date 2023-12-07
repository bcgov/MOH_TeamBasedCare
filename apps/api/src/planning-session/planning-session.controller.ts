import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import {
  PlanningSessionRO,
  SaveCareActivityDTO,
  SaveOccupationDTO,
  SaveProfileDTO,
} from '@tbcm/common';
import { IRequest } from 'src/common/app-request';
import { SessionGuard } from 'src/planning-session/guards/session.guard';
import { SUCCESS_RESPONSE } from '../common/constants';
import { PlanningSession } from './entity/planning-session.entity';
import { PlanningSessionService } from './planning-session.service';

@ApiTags('session')
@Controller('sessions')
@UseInterceptors(ClassSerializerInterceptor)
export class PlanningSessionController {
  constructor(private planningSessionService: PlanningSessionService) {}

  @Get('/last_draft')
  async getDraftPlanningSession(@Req() req: IRequest): Promise<PlanningSessionRO> {
    const session = await this.planningSessionService.getLastDraftPlanningSession(req.user);

    return new PlanningSessionRO(session);
  }

  @Post()
  async createPlanningSession(
    @Req() req: IRequest,
    @Body() saveProfileDto: SaveProfileDTO,
  ): Promise<PlanningSessionRO> {
    const session = await this.planningSessionService.createPlanningSession(
      saveProfileDto,
      req.user,
    );

    return new PlanningSessionRO(session);
  }

  @UseGuards(SessionGuard)
  @Patch('/:sessionId/profile')
  @ApiBody({ type: SaveProfileDTO })
  async saveCurrentProfileSelection(
    @Param('sessionId') sessionId: string,
    @Body() saveProfileDto: SaveProfileDTO,
  ) {
    await this.planningSessionService.saveProfileSelection(sessionId, saveProfileDto);
    return SUCCESS_RESPONSE;
  }

  @UseGuards(SessionGuard)
  @Get('/:sessionId/profile')
  getCurrentProfileSelection(@Param('sessionId') sessionId: string) {
    return this.planningSessionService.getProfileSelection(sessionId);
  }

  @UseGuards(SessionGuard)
  @Get('/:sessionId/care-activity/bundle')
  getBundlesForProfile(@Param('sessionId') sessionId: string) {
    return this.planningSessionService.getBundlesForSelectedCareLocation(sessionId);
  }

  @UseGuards(SessionGuard)
  @Patch('/:sessionId/care-activity')
  @ApiBody({ type: SaveCareActivityDTO })
  async saveCareActivity(
    @Param('sessionId') sessionId: string,
    @Body() careActivityDto: SaveCareActivityDTO,
  ) {
    await this.planningSessionService.saveCareActivity(sessionId, careActivityDto);
    return SUCCESS_RESPONSE;
  }

  @UseGuards(SessionGuard)
  @Get('/:sessionId/care-activity')
  getCareActivity(@Param('sessionId') sessionId: string) {
    return this.planningSessionService.getCareActivity(sessionId);
  }

  @UseGuards(SessionGuard)
  @Patch('/:sessionId/occupation')
  @ApiBody({ type: SaveOccupationDTO })
  async saveOccupation(
    @Param('sessionId') sessionId: string,
    @Body() occupationDto: SaveOccupationDTO,
  ) {
    await this.planningSessionService.saveOccupation(sessionId, occupationDto);
    return SUCCESS_RESPONSE;
  }

  @UseGuards(SessionGuard)
  @Get('/:sessionId/occupation')
  getOccupation(@Param('sessionId') sessionId: string) {
    return this.planningSessionService.getOccupation(sessionId);
  }

  @UseGuards(SessionGuard)
  @Get('/:sessionId/activities-gap')
  getPlanningActivityGap(@Param('sessionId') sessionId: string) {
    return this.planningSessionService.getPlanningActivityGap(sessionId);
  }

  @UseGuards(SessionGuard)
  @Post('/:sessionId/export-csv')
  exportCsv(@Param('sessionId') sessionId: string) {
    return this.planningSessionService.exportCsv(sessionId);
  }
}
