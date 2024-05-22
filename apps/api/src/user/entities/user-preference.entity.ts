import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/base.entity';
import { User } from './user.entity';

@Entity()
export class UserPreference extends BaseEntity {
  // Importing createdBy, updatedBy to prevent circular injection error
  // TypeError: Class extends value undefined is not a constructor or null
  @ManyToOne(() => User)
  createdBy: User;

  @ManyToOne(() => User)
  updatedBy: User;

  @Column({ type: 'boolean', nullable: true })
  notShowConfirmDraftRemoval: boolean;
}
