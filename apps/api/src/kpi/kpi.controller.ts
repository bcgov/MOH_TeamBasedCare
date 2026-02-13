import {
  Controller,
  Get,
  Logger,
  Query,
  Req,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role, KPIFilterDTO, KPIsOverviewRO } from '@tbcm/common';
import { AllowRoles } from 'src/auth/allow-roles.decorator';
import { IRequest } from 'src/common/app-request';
import { KpiService } from './kpi.service';

@ApiTags('kpi')
@Controller('kpi')
@AllowRoles({ roles: [Role.ADMIN, Role.CONTENT_ADMIN] })
@UseInterceptors(ClassSerializerInterceptor)
export class KpiController {
  private readonly logger = new Logger(KpiController.name);

  constructor(private readonly kpiService: KpiService) {}

  @Get('overview')
  async getOverview(
    @Query() filter: KPIFilterDTO,
    @Req() req: IRequest,
  ): Promise<KPIsOverviewRO> {
    // Content editors only see their own health authority's data
    const isAdmin = req.user.roles?.some(r => r === Role.ADMIN);
    if (!isAdmin && !req.user.organization) {
      this.logger.warn(
        `Non-admin user ${req.user.id} has no organization set - KPI data will be empty`,
      );
    }
    const effectiveFilter = isAdmin
      ? filter
      : { ...filter, healthAuthority: req.user.organization || '' };
    return this.kpiService.getKPIsOverview(effectiveFilter);
  }

  @Get('care-settings')
  async getCareSettings(): Promise<{ id: string; displayName: string }[]> {
    return this.kpiService.getCareSettings();
  }
}
