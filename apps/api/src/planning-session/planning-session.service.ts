import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanningSession } from './entity/planning-session.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PlanningSessionService {
  constructor(
    @InjectRepository(PlanningSession)
    private planningSessionrepository: Repository<PlanningSession>,
  ) {}

  async createPlanningSession(): Promise<PlanningSession> {
    const planningSession = this.planningSessionrepository.create();

    await this.planningSessionrepository.save(planningSession);

    return planningSession;
  }
}
