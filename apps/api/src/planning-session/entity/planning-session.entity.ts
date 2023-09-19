import { Unit } from 'src/unit/entity/unit.entity';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CareActivity } from '../../care-activity/entity/care-activity.entity';
import { CustomBaseEntity } from '../../common/custom-base.entity';
import { Occupation } from '../../occupation/entity/occupation.entity';

@Entity()
export class PlanningSession extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  profileOption?: string;

  @ManyToOne(() => Unit)
  careLocation?: Unit;

  @ManyToMany(() => CareActivity)
  @JoinTable()
  careActivity?: CareActivity[];

  @ManyToMany(() => Occupation)
  @JoinTable()
  occupation?: Occupation[];
}
