import { AuditEntity } from 'src/common/audit/audit.entity';
import { Entity } from 'typeorm';

@Entity()
export class UserHistory extends AuditEntity {}
