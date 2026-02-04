import { BeforeInsert, BeforeUpdate, Column, DeleteDateColumn, Entity, OneToMany } from 'typeorm';
import { cleanText } from '../../common/utils';
import { AllowedActivity } from 'src/allowed-activity/entity/allowed-activity.entity';
import { CustomBaseEntity } from '../../common/custom-base.entity';
import { OccupationRelatedResource } from '../dto/occupation-related-resource.dto';

@Entity({
  // defining default sort order for the entity
  // Note: this is default order, and will get overridden if query supplies one
  orderBy: {
    displayOrder: 'ASC',
    name: 'ASC',
  },
})
export class Occupation extends CustomBaseEntity {
  @DeleteDateColumn()
  deletedAt?: Date;
  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  displayName: string;

  @Column({ type: 'smallint', nullable: true })
  displayOrder?: number;

  @Column({ type: 'varchar', length: 4096, nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: false })
  isRegulated?: boolean;

  @Column({ type: 'jsonb', nullable: true })
  relatedResources?: OccupationRelatedResource[];

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
