/**
 * Care Setting Template Permission Entity
 *
 * Defines the permission level for a specific occupation to perform
 * a specific care activity within a care setting template.
 *
 * Permission values:
 * - Y (PERFORM): Occupation can fully perform the activity
 * - LC (LIMITS): Occupation can perform with limits and conditions
 *
 * The combination of (template, careActivity, occupation) must be unique.
 * Permissions cascade delete when the parent template is deleted.
 */
import { Permissions } from '@tbcm/common';
import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { CareActivity } from '../../care-activity/entity/care-activity.entity';
import { CustomBaseEntity } from '../../common/custom-base.entity';
import { Occupation } from '../../occupation/entity/occupation.entity';
import { CareSettingTemplate } from './care-setting-template.entity';

@Entity()
@Unique('template_activity_occupation', ['template', 'careActivity', 'occupation'])
export class CareSettingTemplatePermission extends CustomBaseEntity {
  /** The permission level: Y (can perform) or LC (limits & conditions) */
  @Column({ type: 'enum', enum: Permissions, nullable: false })
  permission: Permissions;

  /** The template this permission belongs to */
  @ManyToOne(() => CareSettingTemplate, template => template.permissions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  template: CareSettingTemplate;

  /** The care activity this permission applies to */
  @ManyToOne(() => CareActivity, { nullable: false })
  careActivity: CareActivity;

  /** The occupation this permission is granted to */
  @ManyToOne(() => Occupation, { nullable: false })
  occupation: Occupation;
}
