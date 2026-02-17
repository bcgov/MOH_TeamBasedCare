import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { PlanningSession } from 'src/planning-session/entity/planning-session.entity';
import { CareSettingTemplate } from 'src/unit/entity/care-setting-template.entity';
import { KpiController } from './kpi.controller';
import { KpiService } from './kpi.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, PlanningSession, CareSettingTemplate])],
  controllers: [KpiController],
  providers: [KpiService],
})
export class KpiModule {}
