import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuditSubscriber } from 'src/common/audit/audit.subscriber';
import { RequestContextService } from 'src/common/request-context.service';
import { Occupation } from '../entity/occupation.entity';
import { OccupationHistory } from '../entity/occupation-history.entity';

@Injectable()
export class OccupationSubscriber extends AuditSubscriber<Occupation> {
  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    readonly requestContextService: RequestContextService,
  ) {
    super(OccupationHistory, requestContextService);
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Occupation;
  }
}
