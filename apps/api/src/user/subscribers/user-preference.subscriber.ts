import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuditSubscriber } from 'src/common/audit/audit.subscriber';
import { RequestContextService } from 'src/common/request-context.service';
import { UserPreference } from '../entities/user-preference.entity';
import { UserPreferenceHistory } from '../entities/user-preference-history.entity';

@Injectable()
export class UserPreferenceSubscriber extends AuditSubscriber<UserPreference> {
  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    readonly requestContextService: RequestContextService,
  ) {
    super(UserPreferenceHistory, requestContextService);
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return UserPreference;
  }
}
