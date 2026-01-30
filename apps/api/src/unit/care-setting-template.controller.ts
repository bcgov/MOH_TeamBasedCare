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
 * - POST (copy): All authenticated users
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
  ): void {
    // GLOBAL templates are visible to all
    if (template.healthAuthority === 'GLOBAL') return;

    // User must have an HA that matches the template
    if (!userHealthAuthority || template.healthAuthority !== userHealthAuthority) {
      throw new ForbiddenException('Cannot access templates belonging to another health authority');
    }
  }

  /**
   * List all care setting templates with pagination and search
   * Filters by user's health authority (plus GLOBAL master templates)
   * Users without an organization only see GLOBAL templates
   */
  @Get('cms/find')
  async findTemplates(
    @Query() query: FindCareSettingTemplatesDto,
    @Req() req: IRequest,
  ): Promise<PaginationRO<CareSettingTemplateRO[]>> {
    // Users without org only see GLOBAL templates (matches no HA-specific templates)
    const healthAuthority = req.user.organization ?? '';
    const [templates, total] = await this.templateService.findTemplates(query, healthAuthority);
    return new PaginationRO([templates, total]);
  }

  /**
   * Get detailed template by ID including selected bundles, activities, and permissions
   * Only returns templates belonging to user's health authority or GLOBAL templates
   */
  @Get(':id')
  async getTemplateById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: IRequest,
  ): Promise<CareSettingTemplateDetailRO> {
    const template = await this.templateService.getTemplateById(id);
    this.validateTemplateAccess(template, req.user.organization);
    return template;
  }

  /**
   * Get all available bundles (care competencies) for a template's unit
   * Only accessible for templates belonging to user's health authority or GLOBAL templates
   */
  @Get(':id/bundles')
  async getBundlesForTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: IRequest,
  ): Promise<BundleRO[]> {
    const template = await this.templateService.getTemplateBasic(id);
    this.validateTemplateAccess(template, req.user.organization);
    return this.templateService.getBundlesForTemplate(id);
  }

  /**
   * Get all occupations available for permission assignment
   * Only accessible for templates belonging to user's health authority or GLOBAL templates
   */
  @Get(':id/occupations')
  async getOccupationsForTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: IRequest,
  ): Promise<OccupationRO[]> {
    const template = await this.templateService.getTemplateBasic(id);
    this.validateTemplateAccess(template, req.user.organization);
    return this.templateService.getOccupationsForTemplate(id);
  }

  /**
   * Create a copy of an existing template (including master templates)
   * The copy can then be customized by the user
   * New template is assigned to user's health authority
   * @throws BadRequestException if user has no organization assigned
   */
  @Post(':id/copy')
  @HttpCode(HttpStatus.CREATED)
  async copyTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCareSettingTemplateCopyDTO,
    @Req() req: IRequest,
  ): Promise<CareSettingTemplateRO> {
    const healthAuthority = req.user.organization;
    if (!healthAuthority) {
      throw new BadRequestException('User must have a health authority assigned to create care settings.');
    }
    return this.templateService.copyTemplate(id, dto, healthAuthority);
  }

  /**
   * Create a copy of an existing template with full customization data
   * Use this for deferred copy creation where user customizes before saving
   * New template is assigned to user's health authority
   * @throws BadRequestException if user has no organization assigned
   */
  @Post(':id/copy-full')
  @HttpCode(HttpStatus.CREATED)
  async copyTemplateWithData(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCareSettingTemplateCopyFullDTO,
    @Req() req: IRequest,
  ): Promise<CareSettingTemplateRO> {
    const healthAuthority = req.user.organization;
    if (!healthAuthority) {
      throw new BadRequestException('User must have a health authority assigned to create care settings.');
    }
    return this.templateService.copyTemplateWithData(id, dto, healthAuthority);
  }

  /**
   * Update a template's name, selected bundles/activities, and permissions
   * Note: Master templates cannot be updated
   * Only templates belonging to user's health authority can be modified
   */
  @Patch(':id')
  @AllowRoles({ roles: [Role.ADMIN, Role.CONTENT_ADMIN] })
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCareSettingTemplateDTO,
    @Req() req: IRequest,
  ): Promise<void> {
    const healthAuthority = req.user.organization;
    await this.templateService.updateTemplate(id, dto, healthAuthority);
  }

  /**
   * Delete a template and all its associated permissions
   * Note: Master templates cannot be deleted
   * Only templates belonging to user's health authority can be deleted
   */
  @Delete(':id')
  @AllowRoles({ roles: [Role.ADMIN, Role.CONTENT_ADMIN] })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: IRequest,
  ): Promise<void> {
    const healthAuthority = req.user.organization;
    await this.templateService.deleteTemplate(id, healthAuthority);
  }
}
