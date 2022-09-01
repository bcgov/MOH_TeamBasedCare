import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AllowedActivity } from './allowed-activities.entity';
import { CustomBaseEntity } from './custom-base.entity';

@Entity()
export class Occupation extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  occupationName: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  isRegulated: boolean;

  @OneToMany(() => AllowedActivity, allowedActivity => allowedActivity.occupation)
  allowedActivities: AllowedActivity[];
}
