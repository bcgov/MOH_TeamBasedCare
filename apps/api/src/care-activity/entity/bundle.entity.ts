import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { cleanText } from '../../common/utils';
import { CareActivity } from './care-activity.entity';
import { CustomBaseEntity } from '../../common/custom-base.entity';

@Entity({
  // defining default sort order for the entity
  // Note: this is default order, and will get overridden if query supplies one
  orderBy: {
    displayName: 'ASC',
    name: 'ASC'
  },
})
export class Bundle extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  name: string;

  @Column({ type: 'varchar', nullable: false, length: 255 })
  displayName: string;

  @Column({ type: 'varchar', length: 3000, nullable: true })
  description?: string;

  @OneToMany(() => CareActivity, careActivity => careActivity.bundle)
  careActivities: CareActivity[];

  @BeforeInsert()
  @BeforeUpdate()
  updateDisplayName(): void {
    if (this.name) {
      this.displayName = this.name;
      this.name = cleanText(this.name);
    }
  }
}
