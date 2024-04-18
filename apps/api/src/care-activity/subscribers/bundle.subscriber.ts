import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuditSubscriber } from 'src/common/audit/audit.subscriber';
import { RequestContextService } from 'src/common/request-context.service';
import { Bundle } from '../entity/bundle.entity';
import { BundleHistory } from '../entity/bundle-history.entity';

@Injectable()
export class BundleSubscriber extends AuditSubscriber<Bundle> {
  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    readonly requestContextService: RequestContextService,
  ) {
    super(BundleHistory, requestContextService);
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Bundle;
  }
}
