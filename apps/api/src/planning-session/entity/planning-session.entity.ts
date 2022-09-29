import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CareActivity } from '../../care-activity/entity/care-activity.entity';
import { CustomBaseEntity } from '../../common/custom-base.entity';
import { Occupation } from '../../occupation/entity/occupation.entity';
import { ProfileSelection } from '../interface';

@Entity()
export class PlanningSession extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('jsonb', { nullable: true })
  profile?: ProfileSelection;

  @ManyToMany(() => CareActivity)
  @JoinTable()
  careActivity?: CareActivity[];

  @ManyToMany(() => Occupation)
  @JoinTable()
  occupation?: Occupation[];
}
