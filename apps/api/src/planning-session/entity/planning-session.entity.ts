import { Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CustomBaseEntity } from '../../entities/custom-base.entity';

@Entity()
export class PlanningSession extends CustomBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
}
