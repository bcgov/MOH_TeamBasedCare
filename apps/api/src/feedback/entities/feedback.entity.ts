import { CustomBaseEntity } from 'src/common/custom-base.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class Feedback extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 4096 })
  text: string;

  @ManyToOne(() => User, { nullable: false })
  createdBy: User;
}
