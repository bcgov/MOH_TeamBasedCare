import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CareActivity } from './careactivity.entity';

@Entity()
export class Occupation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  occupationName: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  isRegulated: boolean;

  @ManyToMany(() => CareActivity, careactivity => careactivity.occupations)
  @JoinTable()
  careActivities: CareActivity[];
}
