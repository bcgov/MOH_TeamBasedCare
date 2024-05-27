import { CustomBaseEntity } from 'src/common/custom-base.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class CareActivitySearchTerm extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  term: string;
}
