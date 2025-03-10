import { Permissions } from '@tbcm/common';
import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { CareActivity } from '../../care-activity/entity/care-activity.entity';
import { CustomBaseEntity } from '../../common/custom-base.entity';
import { Occupation } from '../../occupation/entity/occupation.entity';
import { Unit } from 'src/unit/entity/unit.entity';

@Entity()
@Unique('occupation_careActivity', ['occupation', 'careActivity'])
export class AllowedActivity extends CustomBaseEntity {
  @Column({ type: 'enum', enum: Permissions, nullable: false })
  permission: Permissions;

  @ManyToOne(() => Occupation, occupation => occupation.allowedActivities, { nullable: false })
  occupation: Occupation;

  @ManyToOne(() => CareActivity, careActivity => careActivity.allowedActivities, {
    nullable: false,
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  careActivity: CareActivity;

  @ManyToOne(() => Unit, unit => unit.allowedActivities, { onDelete: 'CASCADE' })
  unit: Unit;
}
