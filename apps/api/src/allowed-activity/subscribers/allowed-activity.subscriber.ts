import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuditSubscriber } from 'src/common/audit/audit.subscriber';
import { RequestContextService } from 'src/common/request-context.service';
import { AllowedActivity } from '../entity/allowed-activity.entity';
import { AllowedActivityHistory } from '../entity/allowed-activity-history.entity';

@Injectable()
export class AllowedActivitySubscriber extends AuditSubscriber<AllowedActivity> {
  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    readonly requestContextService: RequestContextService,
  ) {
    super(AllowedActivityHistory, requestContextService);
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return AllowedActivity;
  }
}
