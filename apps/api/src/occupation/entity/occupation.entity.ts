import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { cleanText } from '../../common/utils';
import { AllowedActivity } from '../../entities/allowed-activities.entity';
import { CustomBaseEntity } from '../../common/custom-base.entity';

@Entity({
  // defining default sort order for the entity
  // Note: this is default order, and will get overridden if query supplies one
  orderBy: {
    displayOrder: 'ASC',
    name: 'ASC',
  },
})
export class Occupation extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  displayName: string;

  @Column({ type: 'smallint', nullable: true })
  displayOrder?: number;

  @Column({ type: 'boolean', default: false })
  isRegulated?: boolean;

  @OneToMany(() => AllowedActivity, allowedActivity => allowedActivity.occupation)
  allowedActivities: AllowedActivity[];

  @BeforeInsert()
  @BeforeUpdate()
  updateDisplayName(): void {
    if (this.name) {
      this.displayName = this.name;
      this.name = cleanText(this.name);
    }
  }
}
