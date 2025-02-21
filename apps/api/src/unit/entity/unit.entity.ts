import { cleanText } from 'src/common/utils';
import { BeforeInsert, BeforeUpdate, Column, Entity, Index, ManyToMany } from 'typeorm';
import { CustomBaseEntity } from '../../common/custom-base.entity';
import { CareActivity } from 'src/care-activity/entity/care-activity.entity';

@Entity()
export class Unit extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  @Index()
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  displayName: string;

  @ManyToMany(() => CareActivity, activity => activity.careLocations)
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
