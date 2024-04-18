import { CustomBaseEntity } from 'src/common/custom-base.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class CareActivitySearchTerm extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  term: string;

  @ManyToOne(() => User, { nullable: false })
  createdBy: User;
}
