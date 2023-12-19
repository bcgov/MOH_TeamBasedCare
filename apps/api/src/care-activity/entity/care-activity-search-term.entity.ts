import { CustomBaseEntity } from 'src/common/custom-base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class CareActivitySearchTerm extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  term: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  createdByUsername: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  createdByName: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  createdByEmail: string;
}
