import { CustomBaseEntity } from 'src/common/custom-base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Feedback extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 4096 })
  text: string;

  /** TODO: update nullable to false during next data cleanup */
  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  @Column({ type: 'varchar', length: 255 })
  createdByEmail: string;

  @Column({ type: 'varchar', length: 255 })
  createdByName: string;

  @Column({ type: 'varchar', length: 255 })
  createdByUsername: string;
}
