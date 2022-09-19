import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CustomBaseEntity } from '../../common/custom-base.entity';
import { ProfileSelection } from '../interface';

@Entity()
export class PlanningSession extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('jsonb', { nullable: true })
  profile?: ProfileSelection;
}
