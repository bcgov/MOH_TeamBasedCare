import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { PlanningSession } from './entity/planning-session.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
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
  ActivityCoverageRO,
  CoverageSummaryRO,
  SimulatedCoverageRO,
  SuggestionAlertRO,
  MinimumTeamResponseRO,
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

/**
 * Scoring weights for V2 suggestion algorithm
 *
 * Tiered scoring system:
 * - Tier 1 (Gap Filling): Activities with 0 coverage - highest priority
 * - Tier 2 (Redundancy): Activities with 1 coverage - build resilience
 * - Tier 3 (Flexibility): All activities contribute density
 */
const SUGGESTION_SCORING = {
  /** Tier weights when gaps exist (gap filling is priority) */
  WITH_GAPS: { gap: 100, fragile: 10, density: 1 },
  /** Tier weights when no gaps (redundancy becomes priority) */
  NO_GAPS: { gap: 0, fragile: 50, density: 5 },
  /** Permission value multipliers - LC weighted at 60% to reflect regulatory constraints */
  PERMISSION_VALUE: { Y: 1.0, LC: 0.6 },
  /** Criticality multiplier by activity type */
  CRITICALITY: {
    RESTRICTED_ACTIVITY: 3,
    ASPECT_OF_PRACTICE: 2,
    TASK: 1,
    DEFAULT: 1,
  },
  /** Bonus multiplier for activities with only LC coverage (more fragile) */
  LC_FRAGILITY_BONUS: 1.5,
} as const;

/** Internal type for permission data from database */
interface PermissionRow {
  permission: string;
  care_activity_id: string;
  occupation_id: string;
  occupation_name: string;
}

/** Internal type for activity info lookup */
interface ActivityInfo {
  name: string;
  activityType: CareActivityType;
  bundleId: string;
  bundleName: string;
}

/** Internal type for coverage counts per activity */
interface CoverageCount {
  yCount: number;
  lcCount: number;
}

/** Internal type for occupation score calculation result */
interface OccupationScoreResult {
  occupationId: string;
  occupationName: string;
  score: number;
  tier: 1 | 2 | 3;
  gapsFilled: number;
  redundancyGains: number;
  activitiesY: Map<string, { activityId: string; bundleId: string }>;
  activitiesLC: Map<string, { activityId: string; bundleId: string }>;
}

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

  // find latest Draft planning sessions
  async getLastDraftPlanningSession(user: User) {
    const planningSession = await this.planningSessionRepo.findOne({
      where: {
        status: PlanningStatus.DRAFT,
        createdBy: {
          id: user.id,
        },
      },
      order: {
        createdAt: -1,
      },
      relations: ['careLocation', 'careSettingTemplate', 'careActivity', 'careActivity.bundle'],
    });

    return planningSession;
  }

  // create a new planning session
  async createPlanningSession(saveProfileDto: SaveProfileDTO): Promise<PlanningSession> {
    const template = await this.careSettingTemplateService.getTemplateForPlanning(
      saveProfileDto.careLocation, // Frontend sends template UUID in this field
    );

    const session: Partial<PlanningSession> = {
      profileOption: saveProfileDto.profileOption,
      careSettingTemplate: template,
      careLocation: template.unit, // ALWAYS set unit too
      careActivity: template.selectedActivities, // Pre-populate for flexible Step 2
    };

    const planningSession = this.planningSessionRepo.create(session);

    await this.planningSessionRepo.save(planningSession);

    const user = planningSession.createdBy;

    //Save preference for user to not show confirmation popup
    if (saveProfileDto.userPrefNotShowConfirmDraftRemoval) {
      await this.userService.upsertUserPreference(user.id, {
        notShowConfirmDraftRemoval: saveProfileDto.userPrefNotShowConfirmDraftRemoval,
      });
    }

    return planningSession;
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
      relations: ['careLocation', 'careSettingTemplate', 'careSettingTemplate.selectedBundles'],
    });

    if (!planningSession?.careLocation?.id) {
      throw new NotFoundException({ message: 'Care Location Not found' });
    }

    // Get all bundles available for the care location
    const allBundles = await this.careActivityService.getCareActivitiesByBundlesForCareLocation(
      planningSession.careLocation.id,
    );

    // If template has selected bundles, filter to only show those
    const selectedBundleIds = planningSession.careSettingTemplate?.selectedBundles?.map(b => b.id);
    if (selectedBundleIds && selectedBundleIds.length > 0) {
      return allBundles.filter(bundle => selectedBundleIds.includes(bundle.id));
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
     *
     * Calculate activity coverage - what % of activities are covered by at least one occupation.
     * For each activity, determine its "best" coverage level:
     * - If ANY occupation has Y → activity is "in scope" (green)
     * - Else if ANY occupation has LC → activity is "limits only" (yellow)
     * - Else → activity is "out of scope" (red)
     */
    const overview: ActivityGapOverview = {};

    // Group permissions by activity to find best coverage per activity
    const permissionsByActivity = _.groupBy(query, 'care_activity_id');

    // Count activities by their best coverage level
    let activitiesWithY = 0; // At least one occupation has Y
    let activitiesWithLCOnly = 0; // Best coverage is LC (no Y)

    for (const activity of careActivities) {
      const perms = permissionsByActivity[activity.id] || [];
      const hasY = perms.some((p: { permission: string }) => p.permission === Permissions.PERFORM);
      const hasLC = perms.some((p: { permission: string }) => p.permission === Permissions.LIMITS);

      if (hasY) {
        activitiesWithY++;
      } else if (hasLC) {
        activitiesWithLCOnly++;
      }
      // else: no coverage (will be counted in outOfScope)
    }

    const totalActivities = careActivities.length || 1; // Avoid division by zero

    const inScopePercentage = Math.round((activitiesWithY / totalActivities) * 100);
    const limitsPercentage = Math.round((activitiesWithLCOnly / totalActivities) * 100);
    const outOfScopePercentage = 100 - inScopePercentage - limitsPercentage;

    overview.inScope = `${inScopePercentage}%`;
    overview.limits = `${limitsPercentage}%`;
    overview.outOfScope = `${outOfScopePercentage}%`;

    // Calculate activity coverage (how many occupations can perform each activity)
    const activityCoverage = new Map<string, number>();
    query.forEach((row: { care_activity_id: string; permission: string }) => {
      if (row.permission === Permissions.PERFORM || row.permission === Permissions.LIMITS) {
        activityCoverage.set(
          row.care_activity_id,
          (activityCoverage.get(row.care_activity_id) || 0) + 1,
        );
      }
    });

    let gapsCount = 0;
    let fragileCount = 0;
    let redundantCount = 0;

    careActivities.forEach(activity => {
      const count = activityCoverage.get(activity.id) || 0;
      if (count === 0) gapsCount++;
      else if (count === 1) fragileCount++;
      else redundantCount++;
    });

    overview.coverage = {
      totalActivities: careActivities.length,
      gapsCount,
      fragileCount,
      redundantCount,
      coveragePercent:
        careActivities.length > 0
          ? Math.round(((fragileCount + redundantCount) / careActivities.length) * 100)
          : 0,
    };

    return {
      headers,
      data: _.sortBy(result, 'name'),
      overview,
      careSetting: planningSession.careLocation?.displayName,
    };
  }

  /**
   * Get occupation suggestions for the planning session (V2 Algorithm)
   *
   * Tiered scoring system with dynamic weights:
   * - Tier 1 (Gap Filling): Activities with 0 coverage - weight: 100 × criticality × permValue
   * - Tier 2 (Redundancy): Activities with 1 coverage - weight: 10 (gaps exist) or 50 (no gaps) × criticality × fragilityBonus × permValue
   * - Tier 3 (Flexibility): All activities contribute density - weight: 1 (gaps exist) or 5 (no gaps) × permValue
   *
   * Criticality multiplier: RESTRICTED_ACTIVITY=3, ASPECT_OF_PRACTICE=2, TASK=1
   * Permission value: Y=1.0, LC=0.6 (LC weighted at 60% to reflect regulatory constraints)
   * Fragility bonus: 1.5x when activity has only LC coverage (no Y)
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

    // 2. Get team occupation IDs (already in session + temp selections)
    // These are "excluded from suggestions" but "included in coverage counting"
    const sessionOccupations = session.occupation || [];
    const teamOccupationIds = new Set([...sessionOccupations.map(o => o.id), ...tempSelectedIds]);

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
        summary: { gaps: [], fragile: [], redundant: [], coveragePercent: 0 },
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
        summary: { gaps: [], fragile: [], redundant: [], coveragePercent: 0 },
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
        summary: { gaps: [], fragile: [], redundant: [], coveragePercent: 0 },
      };
    }

    // 5. Build coverage map from team occupations
    const coverageMap = this.buildTeamCoverageMap(permissions, teamOccupationIds, activityIds);

    // 6. Categorize activities into gaps/fragile/redundant
    const { gaps, fragile, redundant } = this.categorizeActivitiesByCoverage(
      coverageMap,
      activityMap,
    );

    // 7. Determine dynamic weights based on current coverage state
    const hasGaps = gaps.length > 0;
    const weights = hasGaps ? SUGGESTION_SCORING.WITH_GAPS : SUGGESTION_SCORING.NO_GAPS;

    // 8. Group permissions by candidate occupation (not on team)
    const occupationPermissions = this.groupPermissionsByOccupation(permissions, teamOccupationIds);

    // 9. Calculate tiered scores for each candidate occupation
    const occupationScores: OccupationScoreResult[] = [];
    occupationPermissions.forEach((data, occupationId) => {
      const scoreResult = this.calculateOccupationScore(
        occupationId,
        data.name,
        data.permissions,
        activityIds,
        activityMap,
        coverageMap,
        weights,
      );
      if (scoreResult) {
        occupationScores.push(scoreResult);
      }
    });

    // 10. Sort by score DESC, then displayName ASC
    occupationScores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.occupationName.localeCompare(b.occupationName);
    });

    const total = occupationScores.length;

    // 11. Paginate
    const startIndex = (page - 1) * pageSize;
    const paginatedScores = occupationScores.slice(startIndex, startIndex + pageSize);

    // 12. Calculate current coverage percent (before any additions)
    const currentCoveragePercent =
      activityIds.length > 0
        ? Math.round(((fragile.length + redundant.length) / activityIds.length) * 100)
        : 0;

    // 13. Build response with competencies grouped and simulated coverage
    const alerts: SuggestionAlertRO[] = [];
    const suggestions: OccupationSuggestionRO[] = paginatedScores.map(os =>
      this.buildSuggestionWithAlerts(
        os,
        activityMap,
        gaps,
        fragile,
        redundant,
        activityIds.length,
        currentCoveragePercent,
        alerts,
      ),
    );

    // 14. Build coverage summary
    const summary: CoverageSummaryRO = {
      gaps,
      fragile,
      redundant,
      coveragePercent: currentCoveragePercent,
    };

    return {
      suggestions,
      totalUncoveredActivities: gaps.length,
      total,
      page,
      pageSize,
      summary,
      alerts: alerts.length > 0 ? alerts : undefined,
    };
  }

  /**
   * Calculate the minimum team needed to achieve maximum coverage.
   * Uses greedy set cover algorithm (approximation for NP-hard problem).
   *
   * Algorithm:
   * 1. Start with all activities uncovered
   * 2. Repeatedly select occupation that covers most uncovered activities
   * 3. Stop when no more progress can be made or 100% coverage achieved
   */
  async getMinimumTeam(sessionId: string): Promise<MinimumTeamResponseRO> {
    // 1. Load session with required relations
    const session = await this.findOne({
      where: { id: sessionId },
      relations: ['careActivity', 'careActivity.bundle', 'careSettingTemplate', 'careLocation'],
    });

    if (!session) {
      throw new NotFoundException('Planning session not found');
    }

    const activities = session.careActivity || [];
    if (activities.length === 0) {
      return {
        occupationIds: [],
        occupationNames: [],
        achievedCoverage: 0,
        uncoveredActivityIds: [],
        uncoveredActivityNames: [],
        totalActivities: 0,
        isFullCoverage: true,
      };
    }

    const activityIds = activities.map(a => a.id);
    const activityNames = new Map(activities.map(a => [a.id, a.displayName]));

    // 2. Get all permissions
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
        occupationIds: [],
        occupationNames: [],
        achievedCoverage: 0,
        uncoveredActivityIds: activityIds,
        uncoveredActivityNames: activityIds.map(id => activityNames.get(id) || id),
        totalActivities: activities.length,
        isFullCoverage: false,
      };
    }

    // 3. Build occupation -> activities map
    const occupationCoverage = new Map<string, { name: string; activities: Set<string> }>();
    permissions.forEach(p => {
      if (!occupationCoverage.has(p.occupation_id)) {
        occupationCoverage.set(p.occupation_id, {
          name: p.occupation_name,
          activities: new Set(),
        });
      }
      occupationCoverage.get(p.occupation_id)!.activities.add(p.care_activity_id);
    });

    // 4. Greedy set cover algorithm
    const uncovered = new Set(activityIds);
    const selectedTeam: { id: string; name: string }[] = [];
    const selectedIds = new Set<string>();

    // Convert Map to array for easier iteration with type safety
    const occupationList = Array.from(occupationCoverage.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      activities: data.activities,
    }));

    while (uncovered.size > 0) {
      // Find occupation that covers most uncovered activities
      let bestOccupation: { id: string; name: string; covered: string[] } | null = null;

      for (const occ of occupationList) {
        // Skip if already selected
        if (selectedIds.has(occ.id)) continue;

        // Count how many uncovered activities this occupation can cover
        const coveredActivities: string[] = [];
        occ.activities.forEach(actId => {
          if (uncovered.has(actId)) {
            coveredActivities.push(actId);
          }
        });

        if (
          coveredActivities.length > 0 &&
          (!bestOccupation || coveredActivities.length > bestOccupation.covered.length)
        ) {
          bestOccupation = {
            id: occ.id,
            name: occ.name,
            covered: coveredActivities,
          };
        }
      }

      // No more progress possible
      if (!bestOccupation) {
        break;
      }

      // Add best occupation to team and mark activities as covered
      selectedTeam.push({ id: bestOccupation.id, name: bestOccupation.name });
      selectedIds.add(bestOccupation.id);
      bestOccupation.covered.forEach(actId => uncovered.delete(actId));
    }

    // 5. Build response
    const achievedCoverage =
      activities.length > 0
        ? Math.round(((activities.length - uncovered.size) / activities.length) * 100)
        : 0;

    return {
      occupationIds: selectedTeam.map(t => t.id),
      occupationNames: selectedTeam.map(t => t.name),
      achievedCoverage,
      uncoveredActivityIds: Array.from(uncovered),
      uncoveredActivityNames: Array.from(uncovered).map(id => activityNames.get(id) || id),
      totalActivities: activities.length,
      isFullCoverage: uncovered.size === 0,
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // Private helper methods for getSuggestions
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Get criticality multiplier by activity type.
   * Higher criticality = higher score contribution.
   */
  private getCriticality(type: CareActivityType): number {
    switch (type) {
      case CareActivityType.RESTRICTED_ACTIVITY:
        return SUGGESTION_SCORING.CRITICALITY.RESTRICTED_ACTIVITY;
      case CareActivityType.ASPECT_OF_PRACTICE:
        return SUGGESTION_SCORING.CRITICALITY.ASPECT_OF_PRACTICE;
      case CareActivityType.TASK:
        return SUGGESTION_SCORING.CRITICALITY.TASK;
      default:
        this.logger.warn(`Unknown activity type: ${type}, using default criticality`);
        return SUGGESTION_SCORING.CRITICALITY.DEFAULT;
    }
  }

  /**
   * Build coverage map showing how many Y/LC permissions each activity has
   * from the current team (session occupations + temp selections).
   */
  private buildTeamCoverageMap(
    permissions: PermissionRow[],
    teamOccupationIds: Set<string>,
    activityIds: string[],
  ): Map<string, CoverageCount> {
    const coverageMap = new Map<string, CoverageCount>();
    activityIds.forEach(id => coverageMap.set(id, { yCount: 0, lcCount: 0 }));

    permissions.forEach(p => {
      if (teamOccupationIds.has(p.occupation_id)) {
        const coverage = coverageMap.get(p.care_activity_id);
        if (coverage) {
          if (p.permission === 'Y') coverage.yCount++;
          else if (p.permission === 'LC') coverage.lcCount++;
        }
      }
    });

    return coverageMap;
  }

  /**
   * Categorize activities into gaps (0 coverage), fragile (1 coverage),
   * and redundant (2+ coverage) based on the coverage map.
   */
  private categorizeActivitiesByCoverage(
    coverageMap: Map<string, CoverageCount>,
    activityMap: Map<string, ActivityInfo>,
  ): {
    gaps: ActivityCoverageRO[];
    fragile: ActivityCoverageRO[];
    redundant: ActivityCoverageRO[];
  } {
    const gaps: ActivityCoverageRO[] = [];
    const fragile: ActivityCoverageRO[] = [];
    const redundant: ActivityCoverageRO[] = [];

    coverageMap.forEach((coverage, activityId) => {
      const activity = activityMap.get(activityId);
      if (!activity) return;

      const total = coverage.yCount + coverage.lcCount;
      const activityCoverage: ActivityCoverageRO = {
        activityId,
        activityName: activity.name,
        activityType: activity.activityType,
        yCount: coverage.yCount,
        lcCount: coverage.lcCount,
      };

      if (total === 0) gaps.push(activityCoverage);
      else if (total === 1) fragile.push(activityCoverage);
      else redundant.push(activityCoverage);
    });

    return { gaps, fragile, redundant };
  }

  /**
   * Group permissions by candidate occupation (not on team).
   * Returns a map of occupationId -> { name, permissions by activity }.
   */
  private groupPermissionsByOccupation(
    permissions: PermissionRow[],
    teamOccupationIds: Set<string>,
  ): Map<string, { name: string; permissions: Map<string, string> }> {
    const occupationPermissions = new Map<
      string,
      { name: string; permissions: Map<string, string> }
    >();

    permissions.forEach(p => {
      if (!teamOccupationIds.has(p.occupation_id)) {
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

    return occupationPermissions;
  }

  /**
   * Calculate tiered score for a single candidate occupation.
   * Returns score details and activity breakdowns for UI.
   */
  private calculateOccupationScore(
    occupationId: string,
    occupationName: string,
    occupationPermissions: Map<string, string>,
    activityIds: string[],
    activityMap: Map<string, ActivityInfo>,
    coverageMap: Map<string, CoverageCount>,
    weights: { gap: number; fragile: number; density: number },
  ): OccupationScoreResult | null {
    let score = 0;
    let gapsFilled = 0;
    let redundancyGains = 0;

    const activitiesY = new Map<string, { activityId: string; bundleId: string }>();
    const activitiesLC = new Map<string, { activityId: string; bundleId: string }>();

    activityIds.forEach(activityId => {
      const permission = occupationPermissions.get(activityId);
      if (!permission) return;

      const activity = activityMap.get(activityId);
      if (!activity) return;

      const coverage = coverageMap.get(activityId);
      if (!coverage) return;

      const criticality = this.getCriticality(activity.activityType);
      const permValue =
        permission === 'Y'
          ? SUGGESTION_SCORING.PERMISSION_VALUE.Y
          : SUGGESTION_SCORING.PERMISSION_VALUE.LC;
      const totalCoverage = coverage.yCount + coverage.lcCount;

      // Track activities for competency breakdown
      if (permission === 'Y') {
        activitiesY.set(activityId, { activityId, bundleId: activity.bundleId });
      } else if (permission === 'LC') {
        activitiesLC.set(activityId, { activityId, bundleId: activity.bundleId });
      }

      if (totalCoverage === 0) {
        // Tier 1: Gap filling
        gapsFilled++;
        score += weights.gap * criticality * permValue;
      } else if (totalCoverage === 1) {
        // Tier 2: Redundancy
        const fragilityBonus = coverage.yCount === 0 ? SUGGESTION_SCORING.LC_FRAGILITY_BONUS : 1.0;
        redundancyGains++;
        score += weights.fragile * criticality * fragilityBonus * permValue;
      }

      // Tier 3: Density (always contributes)
      score += weights.density * permValue;
    });

    if (score <= 0) return null;

    const tier: 1 | 2 | 3 = gapsFilled > 0 ? 1 : redundancyGains > 0 ? 2 : 3;

    return {
      occupationId,
      occupationName,
      score: Math.round(score),
      tier,
      gapsFilled,
      redundancyGains,
      activitiesY,
      activitiesLC,
    };
  }

  /**
   * Build competency breakdown grouped by bundle for UI display.
   */
  private buildCompetencyBreakdown(
    activitiesY: Map<string, { activityId: string; bundleId: string }>,
    activitiesLC: Map<string, { activityId: string; bundleId: string }>,
    activityMap: Map<string, ActivityInfo>,
  ): SuggestionCompetencyRO[] {
    const competencyMap = new Map<string, SuggestionCompetencyRO>();

    // Add Y activities
    activitiesY.forEach((data, activityId) => {
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
    activitiesLC.forEach((data, activityId) => {
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

    return Array.from(competencyMap.values()).sort((a, b) =>
      a.bundleName.localeCompare(b.bundleName),
    );
  }

  /**
   * Build a single suggestion response with simulated coverage and alerts.
   */
  private buildSuggestionWithAlerts(
    os: OccupationScoreResult,
    activityMap: Map<string, ActivityInfo>,
    gaps: ActivityCoverageRO[],
    fragile: ActivityCoverageRO[],
    redundant: ActivityCoverageRO[],
    totalActivities: number,
    currentCoveragePercent: number,
    alerts: SuggestionAlertRO[],
  ): OccupationSuggestionRO {
    // Build competencies
    const competencies = this.buildCompetencyBreakdown(
      os.activitiesY,
      os.activitiesLC,
      activityMap,
    );

    // Calculate simulated coverage (what-if this occupation is added)
    const gapsRemaining = gaps.length - os.gapsFilled;
    const fragileRemaining = fragile.length - os.redundancyGains + os.gapsFilled;
    const newCoveredCount = fragile.length + redundant.length + os.gapsFilled;
    const newCoveragePercent =
      totalActivities > 0 ? Math.round((newCoveredCount / totalActivities) * 100) : 0;
    const marginalBenefit = newCoveragePercent - currentCoveragePercent;

    const simulatedCoverage: SimulatedCoverageRO = {
      gapsRemaining: Math.max(0, gapsRemaining),
      fragileRemaining: Math.max(0, fragileRemaining),
      coveragePercent: Math.min(100, newCoveragePercent),
      marginalBenefit,
    };

    // Generate alerts for this suggestion
    if (marginalBenefit < 5 && marginalBenefit >= 0) {
      alerts.push({
        type: 'LOW_MARGINAL_BENEFIT',
        message: `Adding ${os.occupationName} would only improve coverage by ${marginalBenefit}%`,
        occupationId: os.occupationId,
        occupationName: os.occupationName,
      });
    }

    if (gaps.length > 0 && os.gapsFilled === 0) {
      alerts.push({
        type: 'NO_GAP_COVERAGE',
        message: `${os.occupationName} cannot fill any of the ${gaps.length} gap activities`,
        occupationId: os.occupationId,
        occupationName: os.occupationName,
      });
    }

    if (os.gapsFilled === 0 && os.redundancyGains === 0) {
      alerts.push({
        type: 'REDUNDANT_ONLY',
        message: `${os.occupationName} only adds redundancy to already well-covered activities`,
        occupationId: os.occupationId,
        occupationName: os.occupationName,
      });
    }

    return {
      occupationId: os.occupationId,
      occupationName: os.occupationName,
      score: os.score,
      tier: os.tier,
      gapsFilled: os.gapsFilled,
      redundancyGains: os.redundancyGains,
      competencies,
      simulatedCoverage,
    };
  }
}
