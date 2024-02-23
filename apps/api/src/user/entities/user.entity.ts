import { CustomBaseEntity } from 'src/common/custom-base.entity';
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserPreference } from './user-preference.entity';
import { Role } from '@tbcm/common';

@Entity({ name: 'users' })
export class User extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  email: string;

  @Column({ type: 'enum', enum: Role, array: true, default: [] })
  roles?: Role[];

  @Column({ type: 'varchar', length: 255, nullable: true })
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
  lastAccessAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt?: Date;

  @OneToOne(() => UserPreference, userPreference => userPreference.user)
  @JoinColumn()
  userPreference?: UserPreference;
}
