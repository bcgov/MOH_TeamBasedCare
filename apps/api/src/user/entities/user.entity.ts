import { CustomBaseEntity } from 'src/common/custom-base.entity';
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserPreference } from './user-preference.entity';

@Entity()
export class User extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  keycloakId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  displayName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  organization: string;

  @OneToOne(() => UserPreference, userPreference => userPreference.user)
  @JoinColumn()
  userPreference: UserPreference;
}
