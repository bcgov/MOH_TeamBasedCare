import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuditSubscriber } from 'src/common/audit/audit.subscriber';
import { RequestContextService } from 'src/common/request-context.service';
import { CareActivity } from '../entity/care-activity.entity';
import { CareActivityHistory } from '../entity/care-activity-history.entity';

@Injectable()
export class CareActivitySubscriber extends AuditSubscriber<CareActivity> {
  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    readonly requestContextService: RequestContextService,
  ) {
    super(CareActivityHistory, requestContextService);
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return CareActivity;
  }
}
