import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuditSubscriber } from 'src/common/audit/audit.subscriber';
import { RequestContextService } from 'src/common/request-context.service';
import { PlanningSession } from '../entity/planning-session.entity';
import { PlanningSessionHistory } from '../entity/planning-session-history.entity';

@Injectable()
export class PlanningSessionSubscriber extends AuditSubscriber<PlanningSession> {
  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    readonly requestContextService: RequestContextService,
  ) {
    super(PlanningSessionHistory, requestContextService);
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return PlanningSession;
  }
}
