import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Bundle } from './bundle.entity';
import { Occupation } from './occupation.entity';

@Entity()
export class CareActivity {
  @PrimaryGeneratedColumn('uuid')
  careactivity_id = '';

  @Column()
  careactivity_name = '';

  @Column()
  careactivity_description = '';

  @ManyToOne(() => Bundle, bundle => bundle.careactivities)
  bundle: Bundle = new Bundle();

  @ManyToMany(() => Occupation, occupation => occupation.careactivities)
  occupations: Occupation[] = [];
}
