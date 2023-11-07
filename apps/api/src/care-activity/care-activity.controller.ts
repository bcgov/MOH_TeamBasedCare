import { ClassSerializerInterceptor, Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationRO } from '@tbcm/common';
import { CareActivityService } from './care-activity.service';
import { BundleRO } from './ro/get-bundle.ro';

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
}
