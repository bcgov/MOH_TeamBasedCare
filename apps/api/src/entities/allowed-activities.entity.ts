import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Permissions } from '../common/constants';
import { CareActivity } from './care-activity.entity';
import { CustomBaseEntity } from './custom-base.entity';
import { Occupation } from './occupation.entity';

@Entity()
export class AllowedActivity extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: Permissions, nullable: false })
  permission: string;

  @ManyToOne(() => Occupation, occupation => occupation.allowedActivities, { nullable: false })
  occupation: Occupation;

  @ManyToOne(() => CareActivity, careActivity => careActivity.occupations, { nullable: false })
  careActivity: CareActivity;
}
