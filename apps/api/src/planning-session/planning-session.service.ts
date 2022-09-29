import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanningSession } from './entity/planning-session.entity';
import { Injectable } from '@nestjs/common';
import { SaveProfileDTO, SaveCareActivityDTO, SaveOccupationDTO } from '@tbcm/common';
import { ProfileSelection } from './interface';
import { CareActivityService } from '../care-activity/care-activity.service';
import { OccupationService } from '../occupation/occupation.service';
import _ from 'lodash';
import { AllowedActivity } from '../entities/allowed-activities.entity';
import { ActivitiesActionType } from '../common/constants';
import { convertActivityGapTableToCSV } from '../common/convert-activity-gap-table-to-csv';

@Injectable()
export class PlanningSessionService {
  constructor(
    @InjectRepository(PlanningSession)
    private planningSessionRepo: Repository<PlanningSession>,
    private careActivityService: CareActivityService,
    private occupationService: OccupationService,
    @InjectRepository(AllowedActivity)
    private allowedActRepo: Repository<AllowedActivity>,
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

  async exportCsv(sessionId: string): Promise<any> {
    const activityGaps = await this.getPlanningActivityGap(sessionId);
    return convertActivityGapTableToCSV(activityGaps);
  }

  async getPlanningActivityGap(sessionId: string): Promise<any> {
    const planningSession = await this.planningSessionRepo.findOne(sessionId, {
      relations: ['careActivity', 'careActivity.bundle', 'occupation'],
    });
    if (!planningSession || !planningSession.occupation || !planningSession.careActivity) {
      return;
    }
    const careActivities = planningSession.careActivity.map(each => {
      return {
        id: each.id,
        name: each.displayName,
        bundle_name: each.bundle.displayName,
      };
    });

    const occupations = planningSession.occupation;
    const groupedBundles = _.groupBy(careActivities, 'bundle_name');

    const headers = ['Activities Bundle'].concat(occupations.map(e => e.displayName));

    const query = await this.planningSessionRepo
      .createQueryBuilder('ps')
      .select('aa.permission, aa.care_activity_id, aa.occupation_id')
      .innerJoin('ps.careActivity', 'ca')
      .innerJoin('ps.occupation', 'o')
      .innerJoin(AllowedActivity, 'aa', 'aa.careActivity = ca.id and aa.occupation = o.id')
      .where('ps.id = :sessionId', { sessionId })
      .getRawMany();

    const groupedMappingActions: { [key: string]: any } = {};

    Object.entries(_.groupBy(query, 'care_activity_id')).forEach(([id, value]) => {
      groupedMappingActions[id] = Object.assign(
        {},
        ...value.map(each => {
          return { [each.occupation_id]: each.permission };
        }),
      );
    });

    const result: any[] = [];
    Object.entries(groupedBundles).forEach(([name, value]) => {
      const data: { [key: string]: any | any[] } = {
        name,
      };

      const occupationSummary: { [key: string]: Set<string> } = {};

      occupations.forEach(eachMember => {
        occupationSummary[eachMember.displayName] = new Set<string>();
      });

      let numberOfGaps = 0;
      const careActivitiesForBundle: any[] = [];
      value.forEach(eachCA => {
        const eachActivity: { [key: string]: any } = {
          name: eachCA.name,
        };
        if (!groupedMappingActions[eachCA.id]) {
          numberOfGaps++;
        }
        const groupedCAAction = groupedMappingActions[eachCA.id];
        occupations.forEach(eachMember => {
          eachActivity[eachMember.displayName] =
            groupedCAAction?.[eachMember.id] ?? ActivitiesActionType.RED;
          occupationSummary[eachMember.displayName].add(eachActivity[eachMember.displayName]);
        });

        careActivitiesForBundle.push(eachActivity);
      });

      Object.entries(occupationSummary).forEach(([name, actions]) => {
        data[name] = actions.size === 1 ? [...actions][0] : ActivitiesActionType.GREY;
      });

      data['numberOfGaps'] = numberOfGaps;
      data['careActivities'] = careActivitiesForBundle;
      result.push(data);
    });

    return {
      headers,
      data: result,
    };
  }
}
