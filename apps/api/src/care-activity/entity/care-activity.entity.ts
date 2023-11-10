import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CareActivityType, ClinicalType } from '../../common/constants';
import { cleanText } from '../../common/utils';
import { AllowedActivity } from 'src/allowed-activity/entity/allowed-activity.entity';
import { Bundle } from './bundle.entity';
import { CustomBaseEntity } from '../../common/custom-base.entity';
import { Unit } from 'src/unit/entity/unit.entity';

@Entity()
export class CareActivity extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  displayName: string;

  @Column({ type: 'varchar', length: 3000, nullable: true })
  description?: string;

  @ManyToOne(() => Bundle, bundle => bundle.careActivities)
  bundle: Bundle;

  @OneToMany(() => AllowedActivity, allowedActivity => allowedActivity.occupation)
  occupations: AllowedActivity[];

  @Column({ type: 'enum', enum: CareActivityType, nullable: false })
  activityType: CareActivityType;

  @Column({ type: 'enum', enum: ClinicalType, nullable: true })
  clinicalType?: ClinicalType;

  @ManyToMany(() => Unit, { cascade: true })
  @JoinTable()
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
