/**
 * Care Setting Template Controller
 *
 * Manages care setting templates which define the available care competencies,
 * activities, and occupation permissions for a health authority unit.
 *
 * Templates can be:
 * - Master templates: Read-only defaults created per unit, cannot be edited/deleted
 * - User templates: Copies of master templates that can be customized
 *
 * Authorization:
 * - GET endpoints: All authenticated users (USER, ADMIN, CONTENT_ADMIN)
 * - POST (copy): Admin roles only (ADMIN, CONTENT_ADMIN)
 * - PATCH/DELETE: Admin roles only (ADMIN, CONTENT_ADMIN)
 */
import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  BundleRO,
  CareSettingTemplateRO,
  CareSettingTemplateDetailRO,
  CreateCareSettingTemplateCopyDTO,
  CreateCareSettingTemplateCopyFullDTO,
  OccupationRO,
  PaginationRO,
  Role,
  UpdateCareSettingTemplateDTO,
} from '@tbcm/common';
import { AllowRoles } from 'src/auth/allow-roles.decorator';
import { IRequest } from 'src/common/app-request';
import { CareSettingTemplateService } from './care-setting-template.service';
import { FindCareSettingTemplatesDto } from './dto/find-care-setting-templates.dto';

@ApiTags('care-settings')
@Controller('care-settings')
@AllowRoles({ roles: [Role.USER, Role.ADMIN, Role.CONTENT_ADMIN] })
@UseInterceptors(ClassSerializerInterceptor)
export class CareSettingTemplateController {
  constructor(private templateService: CareSettingTemplateService) {}

  /**
   * Validate user has access to view a template based on health authority
   * @throws ForbiddenException if user cannot access the template
   */
  private validateTemplateAccess(
    template: { healthAuthority?: string },
    userHealthAuthority: string | undefined,
    isAdmin: boolean = false,
  ): void {
    // ADMIN can access any template
    if (isAdmin) return;

    // GLOBAL templates are visible to all
    if (template.healthAuthority === 'GLOBAL') return;

    // User must have an HA that matches the template
    if (!userHealthAuthority || template.healthAuthority !== userHealthAuthority) {
      throw new ForbiddenException('Cannot access templates belonging to another health authority');
    }
  }

  /**
   * Determine health authority for template copy based on user role
   * - ADMIN creates GLOBAL templates visible to all health authorities
   * - CONTENT_ADMIN and other users create templates scoped to their own health authority
   * @throws BadRequestException if non-admin user has no organization
   */
  private getHealthAuthorityForCopy(req: IRequest): string {
    const isSuperAdmin = req.user.roles?.some(r => r === Role.ADMIN);

    if (isSuperAdmin) {
      return 'GLOBAL';
    }

    if (!req.user.organization) {
      throw new BadRequestException(
        'User must have a health authority assigned to create care settings.',
      );
    }

    return req.user.organization;
  }

  /**
   * List all care setting templates with pagination and search
   * - ADMIN: see ALL templates
   * - CONTENT_ADMIN / Users with HA: see their HA templates + GLOBAL templates
   * - Users without HA: see only GLOBAL templates
   */
  @Get('cms/find')
  async findTemplates(
    @Query() query: FindCareSettingTemplatesDto,
    @Req() req: IRequest,
  ): Promise<PaginationRO<CareSettingTemplateRO[]>> {
    const isAdmin = req.user.roles?.some(r => r === Role.ADMIN);
    const healthAuthority = isAdmin ? null : req.user.organization ?? '';
    const [templates, total] = await this.templateService.findTemplates(query, healthAuthority);
    return new PaginationRO([templates, total]);
  }

  /**
   * Get templates for CMS dropdown filter
   * - ADMIN: see ALL templates across all health authorities
   * - CONTENT_ADMIN / Users with HA: see GLOBAL + their health authority's templates
   *
   * Auth: Uses class-level @AllowRoles (USER, ADMIN, CONTENT_ADMIN) intentionally,
   * consistent with other read endpoints (findTemplates, getTemplateById, etc.).
   */
  @Get('cms/templates-for-filter')
  async getTemplatesForCMSFilter(@Req() req: IRequest): Promise<CareSettingTemplateRO[]> {
    const isAdmin = req.user.roles?.some(r => r === Role.ADMIN);
    const healthAuthority = isAdmin ? null : req.user.organization ?? '';
    return this.templateService.findAllForCMSFilter(healthAuthority);
  }

  /**
   * Get lightweight template data for copy wizard - returns IDs only
   * Avoids loading full permission entities which can timeout on master templates
   */
  @Get(':id/copy-data')
  async getTemplateForCopy(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: IRequest,
  ): Promise<{
    id: string;
    name: string;
    unitId: string;
    selectedBundleIds: string[];
    selectedActivityIds: string[];
    permissions: { activityId: string; occupationId: string; permission: string }[];
  }> {
    const template = await this.templateService.getTemplateBasic(id);
    const isAdmin = req.user.roles?.some(r => r === Role.ADMIN);
    this.validateTemplateAccess(template, req.user.organization, isAdmin);
    return this.templateService.getTemplateForCopy(id);
  }

  /**
   * Get detailed template by ID including selected bundles, activities, and permissions
   * ADMIN can access any template; others can only access their HA or GLOBAL templates
   */
  @Get(':id')
  async getTemplateById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: IRequest,
  ): Promise<CareSettingTemplateDetailRO> {
    const template = await this.templateService.getTemplateById(id);
    const isAdmin = req.user.roles?.some(r => r === Role.ADMIN);
    this.validateTemplateAccess(template, req.user.organization, isAdmin);
    return template;
  }

  /**
   * Get all available bundles (care competencies) for a template's unit
   * ADMIN can access any template; others can only access their HA or GLOBAL templates
   */
  @Get(':id/bundles')
  async getBundlesForTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: IRequest,
  ): Promise<BundleRO[]> {
    const template = await this.templateService.getTemplateBasic(id);
    const isAdmin = req.user.roles?.some(r => r === Role.ADMIN);
    this.validateTemplateAccess(template, req.user.organization, isAdmin);
    return this.templateService.getBundlesForTemplate(id);
  }

  /**
   * Get all occupations available for permission assignment
   * ADMIN can access any template; others can only access their HA or GLOBAL templates
   */
  @Get(':id/occupations')
  async getOccupationsForTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: IRequest,
  ): Promise<OccupationRO[]> {
    const template = await this.templateService.getTemplateBasic(id);
    const isAdmin = req.user.roles?.some(r => r === Role.ADMIN);
    this.validateTemplateAccess(template, req.user.organization, isAdmin);
    return this.templateService.getOccupationsForTemplate(id);
  }

  /**
   * Create a copy of an existing template (including master templates)
   * The copy can then be customized by the user
   * New template is assigned to user's health authority
   * Only ADMIN and CONTENT_ADMIN can create copies
   * @throws BadRequestException if user has no organization assigned
   */
  @Post(':id/copy')
  @AllowRoles({ roles: [Role.ADMIN, Role.CONTENT_ADMIN] })
  @HttpCode(HttpStatus.CREATED)
  async copyTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCareSettingTemplateCopyDTO,
    @Req() req: IRequest,
  ): Promise<CareSettingTemplateRO> {
    const healthAuthority = this.getHealthAuthorityForCopy(req);
    return this.templateService.copyTemplate(id, dto, healthAuthority);
  }

  /**
   * Create a copy of an existing template with full customization data
   * Use this for deferred copy creation where user customizes before saving
   * New template is assigned to user's health authority
   * Only ADMIN and CONTENT_ADMIN can create copies
   * @throws BadRequestException if user has no organization assigned
   */
  @Post(':id/copy-full')
  @AllowRoles({ roles: [Role.ADMIN, Role.CONTENT_ADMIN] })
  @HttpCode(HttpStatus.CREATED)
  async copyTemplateWithData(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCareSettingTemplateCopyFullDTO,
    @Req() req: IRequest,
  ): Promise<CareSettingTemplateRO> {
    const healthAuthority = this.getHealthAuthorityForCopy(req);
    return this.templateService.copyTemplateWithData(id, dto, healthAuthority);
  }

  /**
   * Update a template's name, selected bundles/activities, and permissions
   * Note: Master templates cannot be updated
   * - ADMIN can modify any template regardless of health authority
   * - CONTENT_ADMIN can only modify templates belonging to their health authority
   */
  @Patch(':id')
  @AllowRoles({ roles: [Role.ADMIN, Role.CONTENT_ADMIN] })
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCareSettingTemplateDTO,
    @Req() req: IRequest,
  ): Promise<void> {
    const isSuperAdmin = req.user.roles?.some(r => r === Role.ADMIN);
    const healthAuthority = isSuperAdmin ? undefined : req.user.organization;
    await this.templateService.updateTemplate(id, dto, healthAuthority);
  }

  /**
   * Delete a template and all its associated permissions
   * Note: Master templates cannot be deleted
   * - ADMIN can delete any template regardless of health authority
   * - CONTENT_ADMIN can only delete templates belonging to their health authority
   */
  @Delete(':id')
  @AllowRoles({ roles: [Role.ADMIN, Role.CONTENT_ADMIN] })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: IRequest,
  ): Promise<void> {
    const isSuperAdmin = req.user.roles?.some(r => r === Role.ADMIN);
    const healthAuthority = isSuperAdmin ? undefined : req.user.organization;
    await this.templateService.deleteTemplate(id, healthAuthority);
  }
}
