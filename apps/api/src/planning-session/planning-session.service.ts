import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { PlanningSession } from './entity/planning-session.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  SaveProfileDTO,
  SaveCareActivityDTO,
  SaveOccupationDTO,
  PlanningStatus,
} from '@tbcm/common';
import { IProfileSelection, Permissions } from '@tbcm/common';
import { CareActivityService } from '../care-activity/care-activity.service';
import { OccupationService } from '../occupation/occupation.service';
import _ from 'lodash';
import { AllowedActivity } from 'src/allowed-activity/entity/allowed-activity.entity';
import { ActivitiesActionType } from '../common/constants';
import { UnitService } from 'src/unit/unit.service';
import { Unit } from 'src/unit/entity/unit.entity';
import { BundleRO } from 'src/care-activity/ro/get-bundle.ro';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class PlanningSessionService {
  constructor(
    @InjectRepository(PlanningSession)
    private planningSessionRepo: Repository<PlanningSession>,
    private careActivityService: CareActivityService,
    private occupationService: OccupationService,
    private unitService: UnitService,
  ) {}

  // find planning session from id
  async findOne(sessionId: string, options?: FindOneOptions): Promise<PlanningSession | undefined> {
    const planningSession = await this.planningSessionRepo.findOne(sessionId, options);

    return planningSession;
  }

  // find latest Draft planning sessions
  async getLastDraftPlanningSession(user: User): Promise<PlanningSession | undefined> {
    const planningSession = await this.planningSessionRepo.findOne({
      where: {
        status: PlanningStatus.DRAFT,
        createdBy: user,
      },
      order: {
        createdAt: -1,
      },
      relations: ['careLocation', 'careActivity', 'careActivity.bundle'],
    });

    return planningSession;
  }

  // create a new planning session
  async createPlanningSession(
    saveProfileDto: SaveProfileDTO,
    user: User,
  ): Promise<PlanningSession> {
    const session: Partial<PlanningSession> = {
      profileOption: saveProfileDto.profileOption,
      careLocation: (await this.unitService.getById(saveProfileDto.careLocation)) as Unit,
      createdBy: user,
    };

    const planningSession = this.planningSessionRepo.create(session);

    await this.planningSessionRepo.save(planningSession);

    return planningSession;
  }

  async saveProfileSelection(sessionId: string, saveProfileDto: SaveProfileDTO): Promise<void> {
    // get existing profile
    const planningSession = await this.planningSessionRepo.findOne(sessionId, {
      relations: ['careLocation', 'careActivity'],
    });

    // if planning session not found, throw
    if (!planningSession) {
      throw new NotFoundException('Planning session not found');
    }

    // handle care Location update,
    if (saveProfileDto.careLocation) {
      // if updated care location not same as existing? clear care activities for the session
      if (
        planningSession.careLocation?.id &&
        planningSession.careLocation?.id !== saveProfileDto.careLocation
      ) {
        planningSession.careActivity = [];
      }

      // handle care location update
      planningSession.careLocation = (await this.unitService.getById(
        saveProfileDto.careLocation,
      )) as Unit;
    }

    // handle profile option update
    if (saveProfileDto.profileOption) {
      planningSession.profileOption = saveProfileDto.profileOption;
    }

    await this.planningSessionRepo.save(planningSession);
  }

  async getProfileSelection(sessionId: string): Promise<IProfileSelection> {
    const planningSession = await this.planningSessionRepo.findOne(sessionId, {
      relations: ['careLocation'],
    });
    return {
      profileOption: planningSession?.profileOption || null,
      careLocation: planningSession?.careLocation?.id || null,
    };
  }

  async getBundlesForSelectedCareLocation(sessionId: string): Promise<BundleRO[]> {
    const planningSession = await this.planningSessionRepo.findOne(sessionId, {
      relations: ['careLocation'],
    });

    if (!planningSession?.careLocation?.id) {
      throw new NotFoundException({ message: 'Care Location Not found' });
    }

    return this.careActivityService.getCareActivitiesByBundlesForCareLocation(
      planningSession.careLocation.id,
    );
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
      updatedAt: new Date(), // Manually updating as TypeORM does not update this field when relations are updated;
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
      updatedAt: new Date(), // Manually updating as TypeORM does not update this field when relations are updated;
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

  async getPlanningActivityGap(sessionId: string): Promise<any> {
    const planningSession = await this.planningSessionRepo.findOne(sessionId, {
      relations: ['careActivity', 'careActivity.bundle', 'occupation', 'careLocation'],
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

    // adding manual sorting after values are fetched as nested sorts are only part of typeorm 0.3.0 onwards
    // https://github.com/typeorm/typeorm/issues/2620
    // adding infinity as default display order, giving last position to the occupations whose display order is undefined
    const headers = [{ title: 'Activities Bundle', description: '' }].concat(
      occupations
        .sort((a, b) => (a.displayOrder || Infinity) - (b.displayOrder || Infinity))
        .map(e => ({ title: e.displayName, description: e.description || '' })),
    );

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
      _.sortBy(value, 'name').forEach(eachCA => {
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

    /**
     * overview calculations
     **/
    const overview: {
      inScope?: string;
      limits?: string;
      outOfScope?: string;
    } = {};

    const permissionsGroupedCount = _.countBy(query, 'permission');

    // total occupations selected x total care activities selected
    const total = (occupations.length || 0) * (careActivities.length || 0);

    const inScopePercentage =
      Math.round(((permissionsGroupedCount[Permissions.PERFORM] || 0) / total) * 100) || 0;
    const limitsPercentage =
      Math.round(((permissionsGroupedCount[Permissions.LIMITS] || 0) / total) * 100) || 0;
    const outOfScopePercentage = 100 - (inScopePercentage + limitsPercentage);

    overview.inScope = `${inScopePercentage}%`;
    overview.limits = `${limitsPercentage}%`;
    overview.outOfScope = `${outOfScopePercentage}%`;

    return {
      headers,
      data: _.sortBy(result, 'name'),
      overview,
      careSetting: planningSession.careLocation?.displayName,
    };
  }
}
