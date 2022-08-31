import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Bundle } from './bundle.entity';
import { Occupation } from './occupation.entity';

@Entity()
export class CareActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  careActivityName: string;

  @Column({ type: 'varchar', length: 3000, nullable: false })
  careActivityNameDescription: string;

  @ManyToOne(() => Bundle, bundle => bundle.careActivities)
  bundle: Bundle;

  @ManyToMany(() => Occupation, occupation => occupation.careActivities)
  occupations: Occupation[];
}
