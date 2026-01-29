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
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { CareSettingTemplateService } from './care-setting-template.service';
import { FindCareSettingTemplatesDto } from './dto/find-care-setting-templates.dto';

@ApiTags('care-settings')
@Controller('care-settings')
@AllowRoles({ roles: [Role.USER, Role.ADMIN, Role.CONTENT_ADMIN] })
@UseInterceptors(ClassSerializerInterceptor)
export class CareSettingTemplateController {
  constructor(private templateService: CareSettingTemplateService) {}

  /**
   * List all care setting templates with pagination and search
   */
  @Get('cms/find')
  async findTemplates(
    @Query() query: FindCareSettingTemplatesDto,
  ): Promise<PaginationRO<CareSettingTemplateRO[]>> {
    const [templates, total] = await this.templateService.findTemplates(query);
    return new PaginationRO([templates, total]);
  }

  /**
   * Get detailed template by ID including selected bundles, activities, and permissions
   */
  @Get(':id')
  async getTemplateById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CareSettingTemplateDetailRO> {
    return this.templateService.getTemplateById(id);
  }

  /**
   * Get all available bundles (care competencies) for a template's unit
   */
  @Get(':id/bundles')
  async getBundlesForTemplate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BundleRO[]> {
    return this.templateService.getBundlesForTemplate(id);
  }

  /**
   * Get all occupations available for permission assignment
   */
  @Get(':id/occupations')
  async getOccupationsForTemplate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OccupationRO[]> {
    return this.templateService.getOccupationsForTemplate(id);
  }

  /**
   * Create a copy of an existing template (including master templates)
   * The copy can then be customized by the user
   */
  @Post(':id/copy')
  @HttpCode(HttpStatus.CREATED)
  async copyTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCareSettingTemplateCopyDTO,
  ): Promise<CareSettingTemplateRO> {
    return this.templateService.copyTemplate(id, dto);
  }

  /**
   * Create a copy of an existing template with full customization data
   * Use this for deferred copy creation where user customizes before saving
   */
  @Post(':id/copy-full')
  @HttpCode(HttpStatus.CREATED)
  async copyTemplateWithData(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCareSettingTemplateCopyFullDTO,
  ): Promise<CareSettingTemplateRO> {
    return this.templateService.copyTemplateWithData(id, dto);
  }

  /**
   * Update a template's name, selected bundles/activities, and permissions
   * Note: Master templates cannot be updated
   */
  @Patch(':id')
  @AllowRoles({ roles: [Role.ADMIN, Role.CONTENT_ADMIN] })
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCareSettingTemplateDTO,
  ): Promise<void> {
    await this.templateService.updateTemplate(id, dto);
  }

  /**
   * Delete a template and all its associated permissions
   * Note: Master templates cannot be deleted
   */
  @Delete(':id')
  @AllowRoles({ roles: [Role.ADMIN, Role.CONTENT_ADMIN] })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTemplate(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.templateService.deleteTemplate(id);
  }
}
