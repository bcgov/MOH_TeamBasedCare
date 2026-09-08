import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
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
  FindPlanningSessionsDto,
  GetSuggestionsDTO,
  PaginationRO,
  PlanningSessionRO,
  PlanningSessionSummaryRO,
  RenamePlanningSessionDTO,
  Role,
  SaveCareActivityDTO,
  SaveOccupationDTO,
  SaveProfileDTO,
} from '@tbcm/common';
import { IRequest } from 'src/common/app-request';
import { SessionGuard } from 'src/planning-session/guards/session.guard';
import { SUCCESS_RESPONSE } from '../common/constants';
import { PlanningSessionService } from './planning-session.service';
import { CareSettingTemplateService } from 'src/unit/care-setting-template.service';
import { AllowRoles } from 'src/auth/allow-roles.decorator';

@ApiTags('session')
@Controller('sessions')
@AllowRoles({ roles: [Role.USER] })
@UseInterceptors(ClassSerializerInterceptor)
export class PlanningSessionController {
  constructor(
    private planningSessionService: PlanningSessionService,
    private careSettingTemplateService: CareSettingTemplateService,
  ) {}

  @Get('/care-setting-templates')
  async getCareSettingTemplatesForPlanning(@Req() req: IRequest) {
    // Admin users see all care settings, HA users see their HA + GLOBAL
    const isAdmin = req.user?.roles?.includes(Role.ADMIN);
    const healthAuthority = isAdmin ? null : req.user?.organization ?? '';
    return this.careSettingTemplateService.findAllForPlanning(healthAuthority);
  }

  /**
   * List the requesting planner's draft sessions.
   * Declared before every '/:sessionId' route so Nest does not match 'find' as a session id.
   */
  @Get('/find')
  async findPlanningSessions(@Query() query: FindPlanningSessionsDto, @Req() req: IRequest) {
    const [sessions, total] = await this.planningSessionService.findPlanningSessions(
      query,
      req.user,
    );

    return new PaginationRO([
      sessions.map(session => new PlanningSessionSummaryRO(session)),
      total,
    ]);
  }

  @Get('/last_draft')
  async getDraftPlanningSession(@Req() req: IRequest) {
    const session = await this.planningSessionService.getLastDraftPlanningSession(req.user);

    // if no available last draft return empty
    if (!session) return {};

    return new PlanningSessionRO(session);
  }

  @Post()
  async createPlanningSession(@Body() saveProfileDto: SaveProfileDTO) {
    const session = await this.planningSessionService.createPlanningSession(saveProfileDto);

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
  @Patch('/:sessionId/publish')
  async markSessionPublished(@Param('sessionId') sessionId: string) {
    await this.planningSessionService.markSessionPublished(sessionId);
    return SUCCESS_RESPONSE;
  }

  /**
   * Get occupation suggestions for a planning session.
   * Auth: class-level @AllowRoles(Role.USER) + SessionGuard (session ownership).
   */
  @UseGuards(SessionGuard)
  @Post('/:sessionId/suggestions')
  @ApiBody({ type: GetSuggestionsDTO })
  getSuggestions(@Param('sessionId') sessionId: string, @Body() dto: GetSuggestionsDTO) {
    return this.planningSessionService.getSuggestions(
      sessionId,
      dto.tempSelectedIds || [],
      dto.page || 1,
      dto.pageSize || 10,
    );
  }

  @UseGuards(SessionGuard)
  @Patch('/:sessionId/name')
  @ApiBody({ type: RenamePlanningSessionDTO })
  async renamePlanningSession(
    @Param('sessionId') sessionId: string,
    @Body() renameDto: RenamePlanningSessionDTO,
  ) {
    const session = await this.planningSessionService.renamePlanningSession(
      sessionId,
      renameDto.name,
    );

    return new PlanningSessionSummaryRO(session);
  }

  @UseGuards(SessionGuard)
  @Delete('/:sessionId')
  async discardPlanningSession(@Param('sessionId') sessionId: string) {
    await this.planningSessionService.discardPlanningSession(sessionId);

    return SUCCESS_RESPONSE;
  }
}
