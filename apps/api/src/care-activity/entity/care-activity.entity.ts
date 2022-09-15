import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CareActivityType, ClinicalType } from '../../common/constants';
import { cleanText } from '../../common/utils';
import { AllowedActivity } from '../../entities/allowed-activities.entity';
import { Bundle } from './bundle.entity';
import { CustomBaseEntity } from '../../common/custom-base.entity';

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

  @Column({ type: 'enum', enum: ClinicalType, nullable: false })
  clinicalType: ClinicalType;

  @BeforeInsert()
  @BeforeUpdate()
  updateDisplayName(): void {
    if (this.name) {
      this.displayName = this.name;
      this.name = cleanText(this.name);
    }
  }
}
