import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import {
  GetSuggestionsDTO,
  PlanningSessionRO,
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

  /**
   * Calculate the minimum team needed to achieve target coverage.
   * Uses greedy set cover algorithm to find smallest team.
   * Auth: class-level @AllowRoles(Role.USER) + SessionGuard (session ownership).
   */
  @UseGuards(SessionGuard)
  @Post('/:sessionId/minimum-team')
  getMinimumTeam(@Param('sessionId') sessionId: string) {
    return this.planningSessionService.getMinimumTeam(sessionId);
  }

  /**
   * Analyze which team occupations can be removed without reducing coverage.
   * Auth: class-level @AllowRoles(Role.USER) + SessionGuard (session ownership).
   */
  @UseGuards(SessionGuard)
  @Post('/:sessionId/redundant-occupations')
  getRedundantOccupations(@Param('sessionId') sessionId: string) {
    return this.planningSessionService.getRedundantOccupations(sessionId);
  }
}
