import { CustomBaseEntity } from 'src/common/custom-base.entity';
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserPreference extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, user => user.userPreference)
  user: User;

  @Column({ type: 'boolean', nullable: true })
  notShowConfirmDraftRemoval: boolean;
}
