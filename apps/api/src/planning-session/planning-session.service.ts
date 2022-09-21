import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanningSession } from './entity/planning-session.entity';
import { Injectable } from '@nestjs/common';
import { SaveProfileDTO, SaveCareActivityDTO, SaveOccupationDTO } from '@tbcm/common';
import { ProfileSelection } from './interface';
import { CareActivityService } from '../care-activity/care-activity.service';
import { OccupationService } from '../occupation/occupation.service';
import _ from 'lodash';

@Injectable()
export class PlanningSessionService {
  constructor(
    @InjectRepository(PlanningSession)
    private planningSessionRepo: Repository<PlanningSession>,
    private careActivityService: CareActivityService,
    private occupationService: OccupationService,
  ) {}

  async createPlanningSession(): Promise<PlanningSession> {
    const planningSession = this.planningSessionRepo.create();

    await this.planningSessionRepo.save(planningSession);

    return planningSession;
  }

  async saveProfileSelection(sessionId: string, saveProfileDto: SaveProfileDTO): Promise<void> {
    await this.planningSessionRepo.update(sessionId, { profile: saveProfileDto });
  }

  async getProfileSelection(sessionId: string): Promise<ProfileSelection | undefined> {
    const planningSession = await this.planningSessionRepo.findOne(sessionId);

    if (planningSession) {
      return planningSession.profile;
    }

    return;
  }

  async saveCareActivity(sessionId: string, careActivityDto: SaveCareActivityDTO): Promise<void> {
    if (!careActivityDto.careActivityBundle) {
      return;
    }
    const careActivity = await this.careActivityService.findAllCareActivities(
      Object.values(careActivityDto.careActivityBundle).flatMap(each => each),
    );

    const planningSession = await this.planningSessionRepo.findOne(sessionId);
    await this.planningSessionRepo.save({
      ...planningSession,
      careActivity,
    });
  }

  async getCareActivity(sessionId: string): Promise<{ [key: string]: any[] } | undefined> {
    const planningSession = await this.planningSessionRepo.findOne(sessionId, {
      relations: ['careActivity', 'careActivity.bundle'],
    });

    if (planningSession) {
      const careActivities = planningSession.careActivity?.map(each => {
        return {
          id: each.id,
          bundle_id: each.bundle.id,
        };
      });
      const groupedActivities = _.groupBy(careActivities, 'bundle_id');
      const careActivityBundle: { [key: string]: any[] } = {};

      Object.entries(groupedActivities).forEach(([key, value]) => {
        careActivityBundle[key] = value.map(e => e.id);
      });

      return careActivityBundle;
    }

    return;
  }

  async saveOccupation(sessionId: string, occupationDto: SaveOccupationDTO): Promise<void> {
    const occupation = await this.occupationService.findAllOccupation(occupationDto.occupation);
    const planningSession = await this.planningSessionRepo.findOne(sessionId);
    await this.planningSessionRepo.save({
      ...planningSession,
      occupation,
    });
  }

  async getOccupation(sessionId: string): Promise<string[] | undefined> {
    const planningSession = await this.planningSessionRepo.findOne(sessionId, {
      relations: ['occupation'],
    });

    if (planningSession) {
      return planningSession.occupation?.map(each => each.id);
    }

    return;
  }
}
