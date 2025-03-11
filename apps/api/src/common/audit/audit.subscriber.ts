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

  afterInsert(event: InsertEvent<T>) {
    this.saveHistory(event.connection, event.entity as ObjectLiteral, AuditAction.CREATE);
  }

  afterUpdate(event: UpdateEvent<T>) {
    this.saveHistory(event.connection, event.entity as ObjectLiteral, AuditAction.UPDATE);
  }

  afterRemove(event: RemoveEvent<T>) {
    this.saveHistory(event.connection, (event.entity ?? {}) as ObjectLiteral, AuditAction.DELETE);
  }

  beforeInsert(event: InsertEvent<T>) {
    const user = this._requestContextService.getUser();
    (event.entity as ObjectLiteral).createdBy = user;
    (event.entity as ObjectLiteral).updatedBy = user;
  }

  beforeUpdate(event: UpdateEvent<T>) {
    if (!event.entity) return;

    event.entity.updatedBy = this._requestContextService.getUser();
  }
}
