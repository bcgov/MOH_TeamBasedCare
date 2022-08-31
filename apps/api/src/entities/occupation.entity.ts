import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CareActivity } from './careactivity.entity';

@Entity()
export class Occupation {
  @PrimaryGeneratedColumn('uuid')
  occupation_id = '';

  @Column()
  occupation_name = '';

  @Column()
  is_regulated = false;

  @ManyToMany(() => CareActivity, careactivity => careactivity.occupations)
  @JoinTable()
  careactivities: CareActivity[] = [];
}
