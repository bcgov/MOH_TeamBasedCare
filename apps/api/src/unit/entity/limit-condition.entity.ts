/**
 * Limit Condition Entity
 *
 * Read-only catalogue of the limits an administrator can attach to a
 * permission set to LC. Lifecycle (adding, wording, retiring entries) is owned
 * outside the care settings screens; this feature only reads the catalogue.
 *
 * Entries are deactivated rather than deleted, so a permission that already
 * references one keeps resolving.
 */
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';

@Entity()
export class LimitCondition extends BaseEntity {
  /** Display text shown in the limits and conditions dialog */
  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  /** Optional explanatory text for the administrator */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Presentation order in the dialog */
  @Column({ type: 'int', nullable: false, default: 0 })
  sortOrder: number;

  /** Inactive entries are hidden from new selections but remain resolvable */
  @Column({ type: 'boolean', nullable: false, default: true })
  @Index()
  isActive: boolean;
}
