import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CareActivityRO, PaginationRO } from '@tbcm/common';
import { CareActivityService } from './care-activity.service';
import { BundleRO } from './ro/get-bundle.ro';
import { FindCareActivitiesDto } from './dto/find-care-activities.dto';

@ApiTags('care-activity')
@Controller('care-activity')
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
  ): Promise<PaginationRO<CareActivityRO[]>> {
    const [careActivities, total] = await this.careActivityService.findCareActivities(query);
    return new PaginationRO([
      careActivities.map(careActivity => new CareActivityRO(careActivity)),
      total,
    ]);
  }
}
