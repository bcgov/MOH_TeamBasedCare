import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { cleanText } from '../common/utils';
import { AllowedActivity } from './allowed-activities.entity';
import { Bundle } from './bundle.entity';
import { CustomBaseEntity } from './custom-base.entity';

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

  @BeforeInsert()
  @BeforeUpdate()
  updateDisplayName(): void {
    if (this.name) {
      this.displayName = this.name;
      this.name = cleanText(this.name);
    }
  }
}
