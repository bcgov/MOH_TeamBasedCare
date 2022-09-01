import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CareActivity } from './care-activity.entity';
import { CustomBaseEntity } from './custom-base.entity';

@Entity()
export class Bundle extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  bundleName: string;

  @Column({ type: 'varchar', length: 3000 })
  bundleDescription: string;

  @OneToMany(() => CareActivity, careActivity => careActivity.bundle)
  careActivities: CareActivity[];
}
