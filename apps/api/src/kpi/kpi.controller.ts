import {
  Controller,
  Get,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role, KPIFilterDTO, KPIsOverviewRO } from '@tbcm/common';
import { AllowRoles } from 'src/auth/allow-roles.decorator';
import { KpiService } from './kpi.service';

@ApiTags('kpi')
@Controller('kpi')
@AllowRoles({ roles: [Role.ADMIN, Role.CONTENT_ADMIN] })
@UseInterceptors(ClassSerializerInterceptor)
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get('overview')
  async getOverview(@Query() filter: KPIFilterDTO): Promise<KPIsOverviewRO> {
    return this.kpiService.getKPIsOverview(filter);
  }

  @Get('care-settings')
  async getCareSettings(): Promise<{ id: string; displayName: string }[]> {
    return this.kpiService.getCareSettings();
  }
}
