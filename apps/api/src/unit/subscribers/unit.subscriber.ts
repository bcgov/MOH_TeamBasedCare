import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuditSubscriber } from 'src/common/audit/audit.subscriber';
import { RequestContextService } from 'src/common/request-context.service';
import { Unit } from '../entity/unit.entity';
import { UnitHistory } from '../entity/unit-history.entity';

@Injectable()
export class UnitSubscriber extends AuditSubscriber<Unit> {
  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    readonly requestContextService: RequestContextService,
  ) {
    super(UnitHistory, requestContextService);
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Unit;
  }
}
