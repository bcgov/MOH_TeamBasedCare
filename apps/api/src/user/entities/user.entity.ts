import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { Role } from '@tbcm/common';
import { BaseEntity } from 'src/common/base.entity';
import { UserPreference } from './user-preference.entity';

@Entity({ name: 'users', orderBy: { createdAt: 'DESC' } })
export class User extends BaseEntity {
  // Importing createdBy, updatedBy to prevent circular injection error
  // TypeError: Class extends value undefined is not a constructor or null
  @ManyToOne(() => User)
  createdBy: User;

  @ManyToOne(() => User)
  updatedBy: User;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  email: string;

  @Column({ type: 'enum', enum: Role, array: true, default: [] })
  roles?: Role[];

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  keycloakId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  username?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  firstName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  familyName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  displayName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  organization?: string;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt?: Date | null;

  @OneToOne(() => UserPreference)
  @JoinColumn()
  userPreference?: UserPreference;
}
