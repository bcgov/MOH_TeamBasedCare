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
import { Role, KPIFilterDTO, KPIsOverviewRO, KPICareSettingRO } from '@tbcm/common';
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
  async getOverview(@Query() filter: KPIFilterDTO, @Req() req: IRequest): Promise<KPIsOverviewRO> {
    const ha = this.kpiService.getEffectiveHealthAuthority(req.user);
    if (ha !== null && !req.user.organization) {
      this.logger.warn(
        `Non-admin user ${req.user.id} has no organization set - KPI data will be empty`,
      );
    }
    const effectiveFilter = ha === null ? filter : { ...filter, healthAuthority: ha };
    return this.kpiService.getKPIsOverview(effectiveFilter);
  }

  @Get('care-settings')
  async getCareSettings(@Req() req: IRequest): Promise<KPICareSettingRO[]> {
    const ha = this.kpiService.getEffectiveHealthAuthority(req.user);
    if (ha !== null && !req.user.organization) {
      this.logger.warn(
        `Non-admin user ${req.user.id} has no organization set - KPI data will be empty`,
      );
    }
    return this.kpiService.getCareSettings(ha);
  }
}
