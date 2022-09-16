import { Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CustomBaseEntity } from '../../common/custom-base.entity';

@Entity()
export class PlanningSession extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
}
