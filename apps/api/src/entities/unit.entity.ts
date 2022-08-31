import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CareActivity } from './careactivity.entity';

@Entity()
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  unit_id = '';

  @Column()
  unit_name = '';

  @ManyToMany(() => CareActivity)
  @JoinTable()
  careactivities: CareActivity[] = [];
}
