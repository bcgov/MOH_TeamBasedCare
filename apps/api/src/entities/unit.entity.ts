import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CareActivity } from './careactivity.entity';

@Entity()
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  unitName: string;

  @ManyToMany(() => CareActivity)
  @JoinTable()
  careActivities: CareActivity[];
}
