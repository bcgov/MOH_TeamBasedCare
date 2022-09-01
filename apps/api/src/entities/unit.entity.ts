import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CareActivity } from './care-activity.entity';
import { CustomBaseEntity } from './custom-base.entity';

@Entity()
export class Unit extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  unitName: string;

  @ManyToMany(() => CareActivity)
  @JoinTable()
  careActivities: CareActivity[];
}
