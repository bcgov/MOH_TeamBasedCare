import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AllowedActivity } from './allowed-activities.entity';
import { Bundle } from './bundle.entity';
import { CustomBaseEntity } from './custom-base.entity';

@Entity()
export class CareActivity extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  careActivityName: string;

  @Column({ type: 'varchar', length: 3000 })
  careActivityNameDescription: string;

  @ManyToOne(() => Bundle, bundle => bundle.careActivities)
  bundle: Bundle;

  @OneToMany(() => AllowedActivity, allowedActivity => allowedActivity.occupation)
  occupations: AllowedActivity[];
}