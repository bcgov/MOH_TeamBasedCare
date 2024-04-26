import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuditSubscriber } from 'src/common/audit/audit.subscriber';
import { RequestContextService } from 'src/common/request-context.service';
import { CareActivitySearchTerm } from '../entity/care-activity-search-term.entity';
import { CareActivitySearchTermHistory } from '../entity/care-activity-search-term-history.entity';

@Injectable()
export class CareActivitySearchTermSubscriber extends AuditSubscriber<CareActivitySearchTerm> {
  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    readonly requestContextService: RequestContextService,
  ) {
    super(CareActivitySearchTermHistory, requestContextService);
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return CareActivitySearchTerm;
  }
}
