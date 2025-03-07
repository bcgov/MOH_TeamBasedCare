import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { cleanText } from '../../common/utils';
import { AllowedActivity } from 'src/allowed-activity/entity/allowed-activity.entity';
import { Bundle } from './bundle.entity';
import { CustomBaseEntity } from '../../common/custom-base.entity';
import { Unit } from 'src/unit/entity/unit.entity';
import { CareActivityType, ClinicalType } from '@tbcm/common';

@Entity({
  // defining default sort order for the entity
  // Note: this is default order, and will get overridden if query supplies one
  orderBy: {
    displayName: 'ASC',
    name: 'ASC',
  },
})
export class CareActivity extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  displayName: string;

  @Column({ type: 'varchar', length: 3000, nullable: true })
  description?: string;

  @ManyToOne(() => Bundle, bundle => bundle.careActivities)
  bundle: Bundle;

  @OneToMany(() => AllowedActivity, allowedActivity => allowedActivity.careActivity)
  allowedActivities: AllowedActivity[];

  @Column({ type: 'enum', enum: CareActivityType, nullable: false })
  activityType: CareActivityType;

  @Column({ type: 'enum', enum: ClinicalType, nullable: true })
  clinicalType?: ClinicalType;

  @ManyToMany(() => Unit, unit => unit.careActivities, { cascade: true })
  @JoinTable({ name: 'care_activity_care_locations_unit' })
  careLocations: Unit[];

  @BeforeInsert()
  @BeforeUpdate()
  updateDisplayName(): void {
    if (this.name) {
      this.displayName = this.name;
      this.name = cleanText(this.name);
    }
  }
}
