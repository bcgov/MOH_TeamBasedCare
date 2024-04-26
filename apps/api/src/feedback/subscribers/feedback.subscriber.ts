import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuditSubscriber } from 'src/common/audit/audit.subscriber';
import { RequestContextService } from 'src/common/request-context.service';
import { Feedback } from '../entities/feedback.entity';
import { FeedbackHistory } from '../entities/feedback-history.entity';

@Injectable()
export class FeedbackSubscriber extends AuditSubscriber<Feedback> {
  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    readonly requestContextService: RequestContextService,
  ) {
    super(FeedbackHistory, requestContextService);
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Feedback;
  }
}
