import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuditSubscriber } from 'src/common/audit/audit.subscriber';
import { RequestContextService } from 'src/common/request-context.service';
import { User } from '../entities/user.entity';
import { UserHistory } from '../entities/user-history.entity';

@Injectable()
export class UserSubscriber extends AuditSubscriber<User> {
  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    readonly requestContextService: RequestContextService,
  ) {
    super(UserHistory, requestContextService);
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }
}
