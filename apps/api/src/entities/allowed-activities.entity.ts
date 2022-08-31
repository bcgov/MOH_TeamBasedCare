import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CareActivity } from './care-activity.entity';
import { Occupation } from './occupation.entity';

export enum Permissions {
  PERFORM = 'X',
  ASSIST = 'A',
  CONTINUED_EDUCATION = 'C(E)',
}

@Entity()
export class AllowedActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: Permissions, nullable: false })
  permission: string;

  @ManyToOne(() => Occupation, occupation => occupation.allowedActivities)
  occupation: Occupation;

  @ManyToOne(() => CareActivity, careActivity => careActivity.occupations)
  careActivity: CareActivity;
}
