import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Unit } from './entity/unit.entity';
import { CareSettingTemplate } from './entity/care-setting-template.entity';
import { CareSettingTemplatePermission } from './entity/care-setting-template-permission.entity';
import { UnitController } from './unit.controller';
import { CareSettingTemplateController } from './care-setting-template.controller';
import { UnitService } from './unit.service';
import { CareSettingTemplateService } from './care-setting-template.service';
import { UnitSubscriber } from './subscribers/unit.subscriber';
import { Bundle } from '../care-activity/entity/bundle.entity';
import { CareActivity } from '../care-activity/entity/care-activity.entity';
import { Occupation } from '../occupation/entity/occupation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Unit,
      CareSettingTemplate,
      CareSettingTemplatePermission,
      Bundle,
      CareActivity,
      Occupation,
    ]),
  ],
  exports: [UnitService, CareSettingTemplateService],
  controllers: [UnitController, CareSettingTemplateController],
  providers: [UnitService, CareSettingTemplateService, UnitSubscriber],
})
export class UnitModule {}
