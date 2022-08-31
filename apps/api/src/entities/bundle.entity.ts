import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CareActivity } from './careactivity.entity';

@Entity()
export class Bundle {
  @PrimaryGeneratedColumn('uuid')
  bundle_id = '';

  @Column()
  bundle_name = '';

  @Column()
  bundle_description = '';

  @OneToMany(() => CareActivity, careactivity => careactivity.bundle)
  careactivities: CareActivity[] = [];
}
