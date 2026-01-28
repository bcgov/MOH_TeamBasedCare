/**
 * Care Setting Template Entity
 *
 * Represents a customizable care setting configuration for a health authority unit.
 * Templates define which care competencies (bundles) and activities are available,
 * along with occupation-specific permissions.
 *
 * Two types of templates:
 * - Master templates (isMaster=true): Auto-created per unit, cannot be edited/deleted
 * - User templates (isMaster=false): Copies that users can customize
 *
 * Relationships:
 * - Belongs to one Unit (health authority)
 * - Can have a parent template (for tracking copy lineage)
 * - Has many selected bundles (care competencies)
 * - Has many selected activities (subset of bundle activities)
 * - Has many permissions (activity-occupation permission mappings)
 */
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { CustomBaseEntity } from '../../common/custom-base.entity';
import { Unit } from './unit.entity';
import { Bundle } from '../../care-activity/entity/bundle.entity';
import { CareActivity } from '../../care-activity/entity/care-activity.entity';
import { CareSettingTemplatePermission } from './care-setting-template-permission.entity';

@Entity()
export class CareSettingTemplate extends CustomBaseEntity {
  /** Display name for the template */
  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  /** True for system-generated default templates that cannot be modified */
  @Column({ type: 'boolean', default: false })
  isMaster: boolean;

  /** The health authority unit this template belongs to */
  @ManyToOne(() => Unit, unit => unit.templates, { nullable: false })
  unit: Unit;

  /** The template this was copied from (null for master templates) */
  @ManyToOne(() => CareSettingTemplate, template => template.children, {
    nullable: true,
  })
  parent: CareSettingTemplate;

  /** Templates that were copied from this one */
  @OneToMany(() => CareSettingTemplate, template => template.parent)
  children: CareSettingTemplate[];

  /** Selected care competencies (bundles) for this template */
  @ManyToMany(() => Bundle)
  @JoinTable({ name: 'care_setting_template_bundles' })
  selectedBundles: Bundle[];

  /** Selected care activities from the bundles */
  @ManyToMany(() => CareActivity)
  @JoinTable({ name: 'care_setting_template_activities' })
  selectedActivities: CareActivity[];

  /** Permission mappings for activity-occupation combinations */
  @OneToMany(
    () => CareSettingTemplatePermission,
    permission => permission.template,
    { cascade: true },
  )
  permissions: CareSettingTemplatePermission[];
}
