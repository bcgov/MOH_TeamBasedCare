import { CustomBaseEntity } from 'src/common/custom-base.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class Feedback extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 4096 })
  text: string;
}
