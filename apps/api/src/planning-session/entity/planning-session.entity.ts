import { PlanningStatus } from '@tbcm/common';
import { Unit } from 'src/unit/entity/unit.entity';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, RelationId } from 'typeorm';
import { CareActivity } from '../../care-activity/entity/care-activity.entity';
import { CustomBaseEntity } from '../../common/custom-base.entity';
import { Occupation } from '../../occupation/entity/occupation.entity';

@Entity()
export class PlanningSession extends CustomBaseEntity {
  @Column({ nullable: true })
  profileOption?: string;

  @ManyToOne(() => Unit)
  careLocation?: Unit;

  @RelationId((session: PlanningSession) => session.careLocation)
  careLocationId?: string;

  @ManyToMany(() => CareActivity)
  @JoinTable()
  careActivity?: CareActivity[];

  @ManyToMany(() => Occupation)
  @JoinTable()
  occupation?: Occupation[];

  @Column({ default: PlanningStatus.DRAFT })
  status: string;
}
