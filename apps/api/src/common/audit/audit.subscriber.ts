import {
  DataSource,
  EntitySubscriberInterface,
  InsertEvent,
  ObjectLiteral,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { AuditAction, AuditEntity } from 'src/common/audit/audit.entity';
import { RequestContextService } from '../request-context.service';

export class AuditSubscriber<T> implements EntitySubscriberInterface<T> {
  constructor(
    private readonly historyRepo: typeof AuditEntity,
    private readonly _requestContextService: RequestContextService,
  ) {}

  async saveHistory(dataSource: DataSource, entity: ObjectLiteral, action: AuditAction) {
    const repo = dataSource.getRepository(this.historyRepo);
    await repo.save(
      repo.create({ payload: entity, action, modifiedBy: this._requestContextService.getUser() }),
    );
  }

  async afterInsert(event: InsertEvent<T>) {
    await this.saveHistory(event.connection, event.entity as ObjectLiteral, AuditAction.CREATE);
  }

  async afterUpdate(event: UpdateEvent<T>) {
    await this.saveHistory(event.connection, event.entity as ObjectLiteral, AuditAction.UPDATE);
  }

  async afterRemove(event: RemoveEvent<T>) {
    await this.saveHistory(event.connection, event.entity as ObjectLiteral, AuditAction.DELETE);
  }
}
