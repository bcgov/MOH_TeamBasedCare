import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanningSession } from './entity/planning-session.entity';
import { Injectable } from '@nestjs/common';
import { SaveProfileDTO } from '@tbcm/common';
import { ProfileSelection } from './interface';

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

  async saveProfileSelection(sessionId: string, saveProfileDto: SaveProfileDTO): Promise<void> {
    await this.planningSessionrepository.update(sessionId, { profile: saveProfileDto });
  }

  async getProfileSelection(sessionId: string): Promise<ProfileSelection | undefined> {
    const planningSession = await this.planningSessionrepository.findOne(sessionId);

    if (planningSession) {
      return planningSession.profile;
    }

    return;
  }
}
