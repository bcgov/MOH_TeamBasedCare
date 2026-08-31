import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { PlanningSession } from './entity/planning-session.entity';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  SaveProfileDTO,
  SaveCareActivityDTO,
  SaveOccupationDTO,
  PlanningStatus,
  ActivityGap,
  ActivityGapOverview,
  ActivityGapData,
  ActivityGapHeader,
  ActivityGapCareActivity,
  BundleRO,
  SuggestionResponseRO,
  OccupationSuggestionRO,
  SuggestionCompetencyRO,
  CareActivityType,
  FindPlanningSessionsDto,
  PLANNING_NAME_ERRORS,
  PLANNING_NAME_MAX_LENGTH,
  PLANNING_NAME_MIN_LENGTH,
  PlanningSessionsFindSortKeys,
  SortOrder,
} from '@tbcm/common';
import { IProfileSelection, Permissions } from '@tbcm/common';
import { CareActivityService } from '../care-activity/care-activity.service';
import { OccupationService } from '../occupation/occupation.service';
import _ from 'lodash';
import { AllowedActivity } from 'src/allowed-activity/entity/allowed-activity.entity';
import { ActivitiesActionType } from '../common/constants';
import { UserService } from 'src/user/user.service';
import { CareSettingTemplateService } from 'src/unit/care-setting-template.service';
import { User } from 'src/user/entities/user.entity';
import { AppLogger } from 'src/common/logger.service';

const POSTGRES_UNIQUE_VIOLATION = '23505';
const UNIQUE_NAME_INDEX = 'idx_unique_planning_session_name_per_owner';
const CREATE_NAME_MAX_ATTEMPTS = 50;

/**
 * Escape the LIKE/ILIKE metacharacters so a planner searching for "50%" matches the
 * literal text rather than using it as a wildcard. Pair with `ESCAPE '\\'`.
 */
const escapeLikeTerm = (term: string): string =>
  term.replace(/[\\%_]/g, character => `\\${character}`);

@Injectable()
export class PlanningSessionService {
  private readonly logger = new AppLogger();
  constructor(
    @InjectRepository(PlanningSession)
    private planningSessionRepo: Repository<PlanningSession>,
    private careActivityService: CareActivityService,
    private occupationService: OccupationService,
    private userService: UserService,
    private careSettingTemplateService: CareSettingTemplateService,
  ) {}

  // find planning session from id
  async findOne(options: FindOneOptions<PlanningSession>) {
    const planningSession = await this.planningSessionRepo.findOne(options);

    return planningSession;
  }

  async markSessionPublished(sessionId: string): Promise<void> {
    await this.planningSessionRepo.update(
      { id: sessionId, status: PlanningStatus.DRAFT },
      { status: PlanningStatus.PUBLISHED },
    );
  }

  /**
   * The draft the planner is offered to continue. Ordered by `updatedAt`, not `createdAt`:
   * the radio label reads "Last saved ..." and the drafts table defaults to sorting by
   * Latest Modified, so ordering by creation made the pre-selected draft disagree with the
   * row at the top of that table.
   */
  async getLastDraftPlanningSession(user: User) {
    const planningSession = await this.planningSessionRepo.findOne({
      where: {
        status: PlanningStatus.DRAFT,
        createdBy: {
          id: user.id,
        },
      },
      order: {
        updatedAt: 'DESC',
        // same tie-break as findPlanningSessions, so equal timestamps resolve identically
        id: 'ASC',
      },
      relations: ['careLocation', 'careSettingTemplate', 'careActivity', 'careActivity.bundle'],
    });

    return planningSession;
  }

  // create a new planning session
  // createdBy is populated automatically by AuditSubscriber.beforeInsert
  async createPlanningSession(saveProfileDto: SaveProfileDTO): Promise<PlanningSession> {
    const template = await this.careSettingTemplateService.getTemplateForPlanning(
      saveProfileDto.careLocation, // Frontend sends template UUID in this field
    );

    const baseName = this.generateProvisionalName(template.name, new Date());

    const session: Partial<PlanningSession> = {
      profileOption: saveProfileDto.profileOption,
      careSettingTemplate: template,
      careLocation: template.unit, // ALWAYS set unit too
      careActivity: template.selectedActivities, // Pre-populate for flexible Step 2
    };

    /**
     * Attempt the base name first and increment on a unique-violation from
     * idx_unique_planning_session_name_per_owner. Relying on the constraint keeps the
     * uniqueness check atomic rather than racing a pre-query.
     */
    for (let counter = 1; ; counter++) {
      const planningSession = this.planningSessionRepo.create({
        ...session,
        name: counter === 1 ? baseName : this.appendNameCounter(baseName, counter),
      });

      try {
        await this.planningSessionRepo.save(planningSession);

        return planningSession;
      } catch (e: unknown) {
        if (!this.isUniqueNameViolation(e) || counter >= CREATE_NAME_MAX_ATTEMPTS) {
          throw e;
        }
      }
    }
  }

  /**
   * Provisional name applied at creation: "<care setting name> - <YYYY-MM-DD>".
   * The care setting portion is truncated so the total never exceeds the column length.
   * A care setting is mandatory for a planning session, so there is no fallback branch.
   */
  private generateProvisionalName(careSettingName: string, createdAt: Date): string {
    const datePart = createdAt.toISOString().slice(0, 10);
    const separator = ' - ';
    const available = PLANNING_NAME_MAX_LENGTH - datePart.length - separator.length;

    return `${(careSettingName ?? '').trim().slice(0, available).trim()}${separator}${datePart}`;
  }

  /** Append " (n)", trimming the base so the result still fits the column. */
  private appendNameCounter(baseName: string, counter: number): string {
    const suffix = ` (${counter})`;

    return `${baseName.slice(0, PLANNING_NAME_MAX_LENGTH - suffix.length)}${suffix}`;
  }

  private isUniqueNameViolation(e: unknown): boolean {
    const error = e as { code?: string; constraint?: string; message?: string };

    return (
      error?.code === POSTGRES_UNIQUE_VIOLATION ||
      Boolean(error?.constraint?.includes(UNIQUE_NAME_INDEX)) ||
      Boolean(error?.message?.includes(UNIQUE_NAME_INDEX))
    );
  }

  /**
   * Rename a planning session. Ownership is enforced by SessionGuard on the route.
   */
  async renamePlanningSession(sessionId: string, name: string): Promise<PlanningSession> {
    const planningSession = await this.planningSessionRepo.findOne({
      where: { id: sessionId },
      relations: ['createdBy'],
    });

    if (!planningSession) {
      throw new NotFoundException('Planning session not found');
    }

    const trimmedName = (name ?? '').trim();

    if (
      trimmedName.length < PLANNING_NAME_MIN_LENGTH ||
      trimmedName.length > PLANNING_NAME_MAX_LENGTH
    ) {
      throw new BadRequestException(
        trimmedName.length > PLANNING_NAME_MAX_LENGTH
          ? PLANNING_NAME_ERRORS.TOO_LONG
          : PLANNING_NAME_ERRORS.TOO_SHORT,
      );
    }

    // Reject a case- and whitespace-insensitive duplicate owned by the same planner,
    // excluding the session being renamed so re-confirming an unchanged name succeeds.
    const ownerId = planningSession.createdBy?.id;

    if (ownerId) {
      const duplicate = await this.planningSessionRepo
        .createQueryBuilder('ps')
        .where('ps.createdBy = :ownerId', { ownerId })
        .andWhere('ps.id != :sessionId', { sessionId })
        .andWhere('LOWER(TRIM(ps.name)) = LOWER(:name)', { name: trimmedName })
        .getCount();

      if (duplicate > 0) {
        throw new BadRequestException(PLANNING_NAME_ERRORS.DUPLICATE);
      }
    }

    planningSession.name = trimmedName;

    try {
      await this.planningSessionRepo.save(planningSession);
    } catch (e: unknown) {
      // The unique index is the backstop for a race the pre-check cannot see.
      if (this.isUniqueNameViolation(e)) {
        throw new BadRequestException(PLANNING_NAME_ERRORS.DUPLICATE);
      }

      throw e;
    }

    return planningSession;
  }

  /**
   * Permanently remove a planning session.
   * `remove` is used rather than `delete` so TypeORM clears the
   * planning_session_care_activity_care_activity and
   * planning_session_occupation_occupation junction rows.
   */
  async discardPlanningSession(sessionId: string): Promise<void> {
    const planningSession = await this.planningSessionRepo.findOne({
      where: { id: sessionId },
      relations: ['careActivity', 'occupation'],
    });

    if (!planningSession) {
      throw new NotFoundException('Planning session not found');
    }

    await this.planningSessionRepo.remove(planningSession);
  }

  /**
   * List the requesting planner's draft sessions.
   * The owner is derived solely from the authenticated user; `status` is fixed
   * server-side. Neither is accepted from the query.
   */
  async findPlanningSessions(
    query: FindPlanningSessionsDto,
    user: User,
  ): Promise<[PlanningSession[], number]> {
    const queryBuilder = this.planningSessionRepo
      .createQueryBuilder('ps')
      .leftJoinAndSelect('ps.careSettingTemplate', 'cst')
      .leftJoinAndSelect('ps.careLocation', 'cl')
      .where('ps.createdBy = :ownerId', { ownerId: user.id })
      .andWhere('ps.status = :status', { status: PlanningStatus.DRAFT });

    // Case-insensitive partial match on name only. The term is parameterised, and
    // `%`, `_` and `\` are escaped so they match literally rather than as wildcards.
    if (query.searchText) {
      queryBuilder.andWhere("ps.name ILIKE :search ESCAPE '\\'", {
        search: `%${escapeLikeTerm(query.searchText)}%`,
      });
    }

    const sortOrder = (query.sortOrder as SortOrder) || SortOrder.ASC;

    switch (query.sortBy) {
      case PlanningSessionsFindSortKeys.NAME:
        queryBuilder.orderBy('LOWER(ps.name)', sortOrder);
        break;
      case PlanningSessionsFindSortKeys.CARE_SETTING_NAME:
        queryBuilder.orderBy('LOWER(COALESCE(cst.name, cl.display_name))', sortOrder);
        break;
      case PlanningSessionsFindSortKeys.CREATED_AT:
        queryBuilder.orderBy('ps.createdAt', sortOrder);
        break;
      case PlanningSessionsFindSortKeys.UPDATED_AT:
        queryBuilder.orderBy('ps.updatedAt', sortOrder);
        break;
      default:
        // Most recently worked on first when the planner has not chosen a sort
        queryBuilder.orderBy('ps.updatedAt', SortOrder.DESC);
    }

    queryBuilder.addOrderBy('ps.id', SortOrder.ASC);

    // getManyAndCount counts the whole filtered set, not just the page
    return queryBuilder
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize)
      .getManyAndCount();
  }

  async saveProfileSelection(sessionId: string, saveProfileDto: SaveProfileDTO): Promise<void> {
    // get existing profile
    const planningSession = await this.planningSessionRepo.findOne({
      where: { id: sessionId },
      relations: ['careLocation', 'careSettingTemplate', 'careActivity'],
    });

    // if planning session not found, throw
    if (!planningSession) {
      throw new NotFoundException('Planning session not found');
    }

    // handle care Location / template update
    if (saveProfileDto.careLocation) {
      const newTemplateId = saveProfileDto.careLocation;
      if (planningSession.careSettingTemplateId !== newTemplateId) {
        const newTemplate =
          await this.careSettingTemplateService.getTemplateForPlanning(newTemplateId);
        planningSession.careSettingTemplate = newTemplate;
        planningSession.careLocation = newTemplate.unit;
        planningSession.careActivity = newTemplate.selectedActivities;
      }
    }

    // handle profile option update
    if (saveProfileDto.profileOption) {
      planningSession.profileOption = saveProfileDto.profileOption;
    }

    await this.planningSessionRepo.save(planningSession);
  }

  async getProfileSelection(sessionId: string): Promise<IProfileSelection> {
    const planningSession = await this.planningSessionRepo.findOne({
      where: { id: sessionId },
      relations: ['careLocation', 'careSettingTemplate'],
    });
    return {
      profileOption: planningSession?.profileOption || null,
      careLocation:
        planningSession?.careSettingTemplateId ?? // Prefer template ID for dropdown match
        planningSession?.careLocationId ?? // Fallback for legacy sessions
        null,
    };
  }

  async getBundlesForSelectedCareLocation(sessionId: string): Promise<BundleRO[]> {
    const planningSession = await this.planningSessionRepo.findOne({
      where: { id: sessionId },
      relations: [
        'careLocation',
        'careSettingTemplate',
        'careSettingTemplate.selectedBundles',
        'careSettingTemplate.selectedActivities',
      ],
    });

    if (!planningSession?.careLocation?.id) {
      throw new NotFoundException({ message: 'Care Location Not found' });
    }

    // Get all bundles available for the care location
    const allBundles = await this.careActivityService.getCareActivitiesByBundlesForCareLocation(
      planningSession.careLocation.id,
    );

    // If template has selected bundles, filter bundles AND activities
    const selectedBundleIds = planningSession.careSettingTemplate?.selectedBundles?.map(b => b.id);
    const selectedActivityIds = new Set(
      planningSession.careSettingTemplate?.selectedActivities?.map(a => a.id) || [],
    );

    if (selectedBundleIds && selectedBundleIds.length > 0) {
      // Filter bundles and mutate careActivities in place (avoids BundleRO class prototype loss)
      const filteredBundles = allBundles.filter(bundle => selectedBundleIds.includes(bundle.id));

      // Only filter activities if template has explicit activity selection
      // (empty selectedActivityIds = show all activities within selected bundles)
      if (selectedActivityIds.size > 0) {
        filteredBundles.forEach(bundle => {
          bundle.careActivities =
            bundle.careActivities?.filter(a => selectedActivityIds.has(a.id)) || [];
        });
        return filteredBundles.filter(bundle => (bundle.careActivities?.length ?? 0) > 0);
      }

      return filteredBundles;
    }

    // Fallback: return all bundles (for legacy sessions or templates without bundle selection)
    return allBundles;
  }

  async saveCareActivity(sessionId: string, careActivityDto: SaveCareActivityDTO): Promise<void> {
    if (!careActivityDto.careActivityBundle) {
      return;
    }
    const careActivity = await this.careActivityService.findAllCareActivities(
      Object.values(careActivityDto.careActivityBundle).flatMap(each => each),
    );

    const planningSession = await this.planningSessionRepo.findOneBy({ id: sessionId });
    await this.planningSessionRepo.save({
      ...planningSession,
      careActivity,
      updatedAt: new Date(), // Manually updating as TypeORM does not update this field when relations are updated;
    });
  }

  async getCareActivity(sessionId: string): Promise<{ [key: string]: string[] } | undefined> {
    const planningSession = await this.planningSessionRepo.findOne({
      where: { id: sessionId },
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
      const careActivityBundle: { [key: string]: string[] } = {};

      Object.entries(groupedActivities).forEach(([key, value]) => {
        careActivityBundle[key] = value.map(e => e.id);
      });

      return careActivityBundle;
    }

    return;
  }

  async saveOccupation(sessionId: string, occupationDto: SaveOccupationDTO): Promise<void> {
    const occupation = await this.occupationService.findAllOccupation(occupationDto.occupation);
    const planningSession = await this.planningSessionRepo.findOneBy({ id: sessionId });
    await this.planningSessionRepo.save({
      ...planningSession,
      occupation,
      updatedAt: new Date(), // Manually updating as TypeORM does not update this field when relations are updated;
    });
  }

  async getOccupation(sessionId: string): Promise<string[] | undefined> {
    const planningSession = await this.planningSessionRepo.findOne({
      where: { id: sessionId },
      relations: ['occupation'],
    });

    if (planningSession) {
      return planningSession.occupation?.map(each => each.id);
    }

    return;
  }

  async getPlanningActivityGap(sessionId: string): Promise<ActivityGap | undefined> {
    const planningSession = await this.planningSessionRepo.findOne({
      where: { id: sessionId },
      relations: [
        'careActivity',
        'careActivity.bundle',
        'occupation',
        'careLocation',
        'careSettingTemplate',
      ],
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
    const headers: ActivityGapHeader[] = [
      { title: 'Care Competencies and Corresponding Activities', description: '' },
    ].concat(
      occupations
        .sort((a, b) => (a.displayOrder || Infinity) - (b.displayOrder || Infinity))
        .map(e => ({ title: e.displayName, description: e.description || '' })),
    );

    let query;
    if (planningSession.careSettingTemplateId) {
      // Template-based: read from care_setting_template_permission
      const activityIds = planningSession.careActivity.map(ca => ca.id);
      const occupationIds = planningSession.occupation.map(o => o.id);
      query = await this.careSettingTemplateService.getPermissionsForGap(
        planningSession.careSettingTemplateId,
        activityIds,
        occupationIds,
      );
    } else {
      // Legacy: read from allowed_activity
      query = await this.planningSessionRepo
        .createQueryBuilder('ps')
        .select('aa.permission, aa.care_activity_id, aa.occupation_id')
        .innerJoin('ps.careActivity', 'ca')
        .innerJoin('ps.occupation', 'o')
        .innerJoin(
          AllowedActivity,
          'aa',
          'aa.careActivity = ca.id and aa.occupation = o.id and ps.careLocation.id = aa.unit_id',
        )
        .where('ps.id = :sessionId', { sessionId })
        .getRawMany();
    }

    const groupedMappingActions: { [bundleId: string]: { [careActivityId: string]: string } } = {};

    Object.entries(_.groupBy(query, 'care_activity_id')).forEach(([id, value]) => {
      groupedMappingActions[id] = Object.assign(
        {},
        ...value.map(each => {
          return { [each.occupation_id]: each.permission };
        }),
      );
    });

    const result: Array<ActivityGapData> = [];

    Object.entries(groupedBundles).forEach(([name, value]) => {
      const data: ActivityGapData = {
        name,
      };

      const occupationSummary: { [key: string]: Set<string> } = {};

      occupations.forEach(eachMember => {
        occupationSummary[eachMember.displayName] = new Set<string>();
      });

      let numberOfGaps = 0;
      const careActivitiesForBundle: Array<ActivityGapCareActivity> = [];
      _.sortBy(value, 'name').forEach(eachCA => {
        const eachActivity: ActivityGapCareActivity = {
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
    const overview: ActivityGapOverview = {};

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

  /**
   * Get occupation suggestions for the planning session
   * Calculates scores based on uncovered activities using the scoring algorithm:
   * - Restricted Activity: Y=+4, LC=+3
   * - Aspect of Practice: Y=+3, LC=+2
   * - Task: Y=+2, LC=+1
   */
  async getSuggestions(
    sessionId: string,
    tempSelectedIds: string[] = [],
    page = 1,
    pageSize = 10,
  ): Promise<SuggestionResponseRO> {
    // 1. Load session with required relations
    const session = await this.findOne({
      where: { id: sessionId },
      relations: [
        'careActivity',
        'careActivity.bundle',
        'occupation',
        'careSettingTemplate',
        'careLocation',
      ],
    });

    if (!session) {
      throw new NotFoundException('Planning session not found');
    }

    // 2. Get excluded occupation IDs (already in session + temp selections)
    const sessionOccupations = session.occupation || [];
    const excludedOccupationIds = new Set([
      ...sessionOccupations.map(o => o.id),
      ...tempSelectedIds,
    ]);

    // 3. Get all activities for session
    const activities = session.careActivity || [];
    if (activities.length === 0) {
      return {
        suggestions: [],
        totalUncoveredActivities: 0,
        total: 0,
        page,
        pageSize,
        message: 'No care activities selected',
      };
    }

    const activityIds = activities.map(a => a.id);

    // Build activity lookup map
    const activityMap = new Map(
      activities.map(a => [
        a.id,
        {
          name: a.displayName,
          activityType: a.activityType as CareActivityType,
          bundleId: a.bundle.id,
          bundleName: a.bundle.displayName,
        },
      ]),
    );

    // 4. Get permissions (template or legacy path)
    let permissions: {
      permission: string;
      care_activity_id: string;
      occupation_id: string;
      occupation_name: string;
    }[];

    if (session.careSettingTemplate?.id) {
      permissions = await this.careSettingTemplateService.getPermissionsForSuggestions(
        session.careSettingTemplate.id,
        activityIds,
      );
    } else if (session.careLocation?.id) {
      // Legacy path: use inline join like getPlanningActivityGap
      permissions = await this.planningSessionRepo
        .createQueryBuilder('ps')
        .select('aa.permission', 'permission')
        .addSelect('aa.care_activity_id', 'care_activity_id')
        .addSelect('aa.occupation_id', 'occupation_id')
        .addSelect('o.displayName', 'occupation_name')
        .innerJoin('ps.careActivity', 'ca')
        .innerJoin(AllowedActivity, 'aa', 'aa.careActivity = ca.id AND aa.unit = ps.careLocation')
        .innerJoin('aa.occupation', 'o')
        .where('ps.id = :sessionId', { sessionId })
        .andWhere('aa.permission IN (:...perms)', { perms: ['Y', 'LC'] })
        .getRawMany();
    } else {
      return {
        suggestions: [],
        totalUncoveredActivities: 0,
        total: 0,
        page,
        pageSize,
        message: 'No care setting selected',
      };
    }

    if (permissions.length === 0) {
      return {
        suggestions: [],
        totalUncoveredActivities: activities.length,
        total: 0,
        page,
        pageSize,
        message: 'No permission data available',
      };
    }

    // 5. Find covered activities (by excluded occupations)
    const coveredActivityIds = new Set<string>();
    permissions.forEach(p => {
      if (excludedOccupationIds.has(p.occupation_id)) {
        coveredActivityIds.add(p.care_activity_id);
      }
    });

    const uncoveredActivityIds = activityIds.filter(id => !coveredActivityIds.has(id));
    const totalUncoveredActivities = uncoveredActivityIds.length;

    // 6. Group permissions by occupation
    const occupationPermissions = new Map<
      string,
      { name: string; permissions: Map<string, string> }
    >();
    permissions.forEach(p => {
      if (!excludedOccupationIds.has(p.occupation_id)) {
        if (!occupationPermissions.has(p.occupation_id)) {
          occupationPermissions.set(p.occupation_id, {
            name: p.occupation_name,
            permissions: new Map(),
          });
        }
        occupationPermissions
          .get(p.occupation_id)!
          .permissions.set(p.care_activity_id, p.permission);
      }
    });

    // 7. Calculate scores for each occupation
    const occupationScores: {
      occupationId: string;
      occupationName: string;
      score: number;
      activitiesY: Map<string, { activityId: string; bundleId: string }>;
      activitiesLC: Map<string, { activityId: string; bundleId: string }>;
    }[] = [];

    occupationPermissions.forEach((data, occupationId) => {
      let score = 0;
      const activitiesY = new Map<string, { activityId: string; bundleId: string }>();
      const activitiesLC = new Map<string, { activityId: string; bundleId: string }>();

      uncoveredActivityIds.forEach(activityId => {
        const permission = data.permissions.get(activityId);
        if (!permission) return;

        const activity = activityMap.get(activityId);
        if (!activity) return;

        // Calculate base value by activity type
        let baseValue = 0;
        switch (activity.activityType) {
          case CareActivityType.RESTRICTED_ACTIVITY:
            baseValue = 4;
            break;
          case CareActivityType.ASPECT_OF_PRACTICE:
            baseValue = 3;
            break;
          case CareActivityType.TASK:
            baseValue = 2;
            break;
        }

        if (permission === 'Y') {
          score += baseValue;
          activitiesY.set(activityId, { activityId, bundleId: activity.bundleId });
        } else if (permission === 'LC') {
          score += baseValue - 1;
          activitiesLC.set(activityId, { activityId, bundleId: activity.bundleId });
        }
      });

      if (score > 0) {
        occupationScores.push({
          occupationId,
          occupationName: data.name,
          score,
          activitiesY,
          activitiesLC,
        });
      }
    });

    // 8. Sort by score DESC, then coverage breadth DESC, then name ASC
    occupationScores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aCoverage = a.activitiesY.size + a.activitiesLC.size;
      const bCoverage = b.activitiesY.size + b.activitiesLC.size;
      if (bCoverage !== aCoverage) return bCoverage - aCoverage;
      return (
        a.occupationName.localeCompare(b.occupationName) ||
        a.occupationId.localeCompare(b.occupationId)
      );
    });

    const total = occupationScores.length;

    // 9. Paginate
    const startIndex = (page - 1) * pageSize;
    const paginatedScores = occupationScores.slice(startIndex, startIndex + pageSize);

    // 10. Build response with competencies grouped
    const suggestions: OccupationSuggestionRO[] = paginatedScores.map(os => {
      // Group by bundle
      const competencyMap = new Map<string, SuggestionCompetencyRO>();

      // Add Y activities
      os.activitiesY.forEach((data, activityId) => {
        const activity = activityMap.get(activityId)!;
        if (!competencyMap.has(data.bundleId)) {
          competencyMap.set(data.bundleId, {
            bundleId: data.bundleId,
            bundleName: activity.bundleName,
            activitiesY: [],
            activitiesLC: [],
          });
        }
        competencyMap.get(data.bundleId)!.activitiesY.push({
          activityId,
          activityName: activity.name,
          activityType: activity.activityType,
        });
      });

      // Add LC activities
      os.activitiesLC.forEach((data, activityId) => {
        const activity = activityMap.get(activityId)!;
        if (!competencyMap.has(data.bundleId)) {
          competencyMap.set(data.bundleId, {
            bundleId: data.bundleId,
            bundleName: activity.bundleName,
            activitiesY: [],
            activitiesLC: [],
          });
        }
        competencyMap.get(data.bundleId)!.activitiesLC.push({
          activityId,
          activityName: activity.name,
          activityType: activity.activityType,
        });
      });

      return {
        occupationId: os.occupationId,
        occupationName: os.occupationName,
        score: os.score,
        competencies: Array.from(competencyMap.values()).sort((a, b) =>
          a.bundleName.localeCompare(b.bundleName),
        ),
      };
    });

    return {
      suggestions,
      totalUncoveredActivities,
      total,
      page,
      pageSize,
    };
  }
}
