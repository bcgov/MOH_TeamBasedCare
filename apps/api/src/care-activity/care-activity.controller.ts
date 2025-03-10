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
} from '@tbcm/common';
import { CareActivityService } from './care-activity.service';
import { FindCareActivitiesDto } from './dto/find-care-activities.dto';
import { AllowRoles } from 'src/auth/allow-roles.decorator';
import { EditCareActivityDTO } from './dto/edit-care-activity.dto';
import { FindCareActivitiesCMSDto } from './dto/find-care-activities-cms.dto';
import { CareActivityBulkService } from './care-activity-bulk.service';

@ApiTags('care-activity')
@Controller('care-activity')
@AllowRoles({ roles: [Role.USER] })
@UseInterceptors(ClassSerializerInterceptor)
export class CareActivityController {
  constructor(
    private careActivityService: CareActivityService,
    private careActivityBulkService: CareActivityBulkService,
  ) {}

  @Get('/bundle')
  async getAllBundles(): Promise<PaginationRO<BundleRO[]>> {
    const bundles = await this.careActivityService.getAllBundles();
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
  @AllowRoles({ roles: [Role.CONTENT_ADMIN] })
  async findCareActivitiesCMS(
    @Query() query: FindCareActivitiesCMSDto,
  ): Promise<PaginationRO<CareActivityCMSRO[]>> {
    const [careActivities, total] = await this.careActivityService.findCareActivitiesCMS(query);
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

  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AllowRoles({ roles: [Role.ADMIN] })
  async updateCareActivityById(@Body() data: EditCareActivityDTO, @Param('id') id: string) {
    await this.careActivityService.updateCareActivity(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AllowRoles({ roles: [Role.CONTENT_ADMIN] })
  async removeCareActivity(@Param('id') id: string) {
    await this.careActivityService.removeCareActivity(id);
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
