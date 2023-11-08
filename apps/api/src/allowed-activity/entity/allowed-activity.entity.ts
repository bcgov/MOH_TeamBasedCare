import { Permissions } from '@tbcm/common';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { CareActivity } from '../../care-activity/entity/care-activity.entity';
import { CustomBaseEntity } from '../../common/custom-base.entity';
import { Occupation } from '../../occupation/entity/occupation.entity';

@Entity()
@Unique('occupation_careActivity', ['occupation', 'careActivity'])
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
