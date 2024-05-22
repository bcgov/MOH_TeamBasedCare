import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BundleRO, CareActivityCMSRO, CareActivityRO, PaginationRO, Role } from '@tbcm/common';
import { CareActivityService } from './care-activity.service';
import { FindCareActivitiesDto } from './dto/find-care-activities.dto';
import { IRequest } from 'src/common/app-request';
import { AllowRoles } from 'src/auth/allow-roles.decorator';
import { EditCareActivityDTO } from './dto/edit-care-activity.dto';
import { FindCareActivitiesCMSDto } from './dto/find-care-activities-cms.dto';

@ApiTags('care-activity')
@Controller('care-activity')
@AllowRoles({ roles: [Role.USER] })
@UseInterceptors(ClassSerializerInterceptor)
export class CareActivityController {
  constructor(private careActivityService: CareActivityService) {}

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
    @Req() req: IRequest,
  ): Promise<PaginationRO<CareActivityRO[]>> {
    const [careActivities, total] = await this.careActivityService.findCareActivities(
      query,
      req.user,
    );
    return new PaginationRO([
      careActivities.map(careActivity => new CareActivityRO(careActivity)),
      total,
    ]);
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
}
