import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareActivityController } from './care-activity.controller';
import { CareActivityService } from './care-activity.service';
import { Bundle } from './entity/bundle.entity';
import { CareActivity } from './entity/care-activity.entity';
import { CareActivitySearchTerm } from './entity/care-activity-search-term.entity';
import { UnitModule } from 'src/unit/unit.module';

@Module({
  imports: [TypeOrmModule.forFeature([CareActivity, Bundle, CareActivitySearchTerm]), UnitModule],
  providers: [Logger, CareActivityService],
  controllers: [CareActivityController],
  exports: [CareActivityService],
})
export class CareActivityModule {}
