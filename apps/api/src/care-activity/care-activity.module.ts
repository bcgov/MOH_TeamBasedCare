import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareActivityController } from './care-activity.controller';
import { CareActivityService } from './care-activity.service';
import { Bundle } from './entity/bundle.entity';
import { CareActivity } from './entity/care-activity.entity';
import { CareActivitySearchTerm } from './entity/care-activity-search-term.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CareActivity, Bundle, CareActivitySearchTerm])],
  providers: [Logger, CareActivityService],
  controllers: [CareActivityController],
  exports: [CareActivityService],
})
export class CareActivityModule {}
