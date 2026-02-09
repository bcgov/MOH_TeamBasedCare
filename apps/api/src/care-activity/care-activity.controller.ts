import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CareActivityBulkDTO,
  BundleRO,
  CareActivityCMSRO,
  CareActivityRO,
  PaginationRO,
  Role,
  CareActivityDetailRO,
  EditCareActivityDTO,
} from '@tbcm/common';
import { CareActivityService } from './care-activity.service';
import { FindCareActivitiesDto } from './dto/find-care-activities.dto';
import { AllowRoles } from 'src/auth/allow-roles.decorator';
import { FindCareActivitiesCMSDto } from './dto/find-care-activities-cms.dto';
import { CareActivityBulkService } from './care-activity-bulk.service';
import { IRequest } from 'src/common/app-request';

@ApiTags('care-activity')
@Controller('care-activity')
@AllowRoles({ roles: [Role.USER] })
@UseInterceptors(ClassSerializerInterceptor)
export class CareActivityController {
  constructor(
    private careActivityService: CareActivityService,
    private careActivityBulkService: CareActivityBulkService,
  ) {}

  @Get('/bundles')
  async getAllBundles(): Promise<BundleRO[]> {
    const bundles = await this.careActivityService.getAllBundles();
    return bundles.map(bundle => new BundleRO(bundle));
  }

  @Get('/by-bundles')
  async getAllBundlesWithActivities(): Promise<PaginationRO<BundleRO[]>> {
    const bundles = await this.careActivityService.getAllBundlesWithActivities();
    return new PaginationRO<BundleRO[]>([
      bundles.map(bundle => new BundleRO(bundle)),
      bundles?.length,
    ]);
  }

  @Get('find')
  async findCareActivities(
    @Query() query: FindCareActivitiesDto,
  ): Promise<PaginationRO<CareActivityRO[]>> {
    const [careActivities, total] = await this.careActivityService.findCareActivities(query);
    return new PaginationRO([
      careActivities.map(careActivity => new CareActivityRO(careActivity)),
      total,
    ]);
  }

  @Get('cms/download')
  @AllowRoles({ roles: [Role.CONTENT_ADMIN] })
  async downloadCareActivities() {
    return this.careActivityBulkService.downloadCareActivities();
  }

  @Get('cms/find')
  @AllowRoles({ roles: [Role.ADMIN, Role.CONTENT_ADMIN] })
  async findCareActivitiesCMS(
    @Query() query: FindCareActivitiesCMSDto,
    @Req() req: IRequest,
  ): Promise<PaginationRO<CareActivityCMSRO[]>> {
    // Admins (ADMIN or CONTENT_ADMIN) see all templates; others see their HA + GLOBAL
    const isAdmin = req.user.roles?.some(r => r === Role.ADMIN || r === Role.CONTENT_ADMIN);
    const healthAuthority = isAdmin ? null : (req.user.organization ?? '');

    const [careActivities, total] = await this.careActivityService.findCareActivitiesCMS(
      query,
      healthAuthority,
    );
    return new PaginationRO([
      careActivities.map(careActivity => new CareActivityCMSRO(careActivity)),
      total,
    ]);
  }

  @Get('common-search-terms')
  async getCommonSearchTerms(): Promise<string[]> {
    const commonSearchTerms = await this.careActivityService.getCommonSearchTerms();

    return commonSearchTerms;
  }

  @Get(':id')
  async getCareActivityById(
    @Param('id') id: string,
    @Query('unitId') unitId: string,
  ): Promise<CareActivityDetailRO> {
    const careActivity = await this.careActivityService.getCareActivityById(id, unitId);
    const careActivityDetail = new CareActivityDetailRO(careActivity);
    return this.careActivityService.fillMissingAllowedActivities(careActivityDetail);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AllowRoles({ roles: [Role.ADMIN] })
  async updateCareActivityById(@Body() data: EditCareActivityDTO, @Param('id') id: string) {
    await this.careActivityService.updateCareActivity(id, data);
  }

  @Delete(':id/:unitName')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AllowRoles({ roles: [Role.CONTENT_ADMIN] })
  async removeCareActivity(@Param('id') id: string, @Param('unitName') unitName: string) {
    await this.careActivityService.removeCareActivity(id, unitName);
  }

  /** CMS Bulk */

  // validate
  @Post('cms/bulk/validate')
  @HttpCode(HttpStatus.OK)
  @AllowRoles({ roles: [Role.CONTENT_ADMIN] })
  validateCareActivitiesCMS(@Body() careActivitiesBulkDto: CareActivityBulkDTO) {
    return this.careActivityBulkService.validateCareActivitiesBulk(careActivitiesBulkDto);
  }

  // confirm and upload
  @Post('cms/bulk/upload')
  @HttpCode(HttpStatus.OK)
  @AllowRoles({ roles: [Role.CONTENT_ADMIN] })
  uploadCareActivitiesCMS(@Body() careActivitiesBulkDto: CareActivityBulkDTO) {
    return this.careActivityBulkService.uploadCareActivitiesBulk(careActivitiesBulkDto);
  }
}
