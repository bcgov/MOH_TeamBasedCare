import { User } from 'src/user/entities/user.entity';
import { Column, CreateDateColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export class AuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 20 })
  action: AuditAction;

  @CreateDateColumn()
  modifiedAt: Date;

  @ManyToOne(() => User)
  modifiedBy: User;

  @Column({ type: 'jsonb' })
  payload: unknown;
}
