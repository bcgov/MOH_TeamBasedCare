import { ManyToOne } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { BaseEntity } from './base.entity';

export class CustomBaseEntity extends BaseEntity {
  @ManyToOne(() => User)
  createdBy: User;

  @ManyToOne(() => User)
  updatedBy: User;
}
