import { CareActivityType } from '../constants/careActivityType';

export interface SuggestionActivityRO {
  activityId: string;
  activityName: string;
  activityType: CareActivityType;
}

export interface SuggestionCompetencyRO {
  bundleId: string;
  bundleName: string;
  activitiesY: SuggestionActivityRO[];
  activitiesLC: SuggestionActivityRO[];
}

/** Simulated coverage if this occupation is added to the team */
export interface SimulatedCoverageRO {
  /** How many gap activities would remain after adding this occupation */
  gapsRemaining: number;
  /** How many fragile activities would remain after adding this occupation */
  fragileRemaining: number;
  /** New coverage percentage if this occupation is added */
  coveragePercent: number;
  /** Percentage improvement over current coverage */
  marginalBenefit: number;
}

export interface OccupationSuggestionRO {
  occupationId: string;
  occupationName: string;
  score: number;
  competencies: SuggestionCompetencyRO[];
  /** Highest tier this occupation contributes to: 1=gap filling, 2=redundancy, 3=flexibility */
  tier: 1 | 2 | 3;
  /** Number of gap activities (0 coverage) this occupation can cover */
  gapsFilled: number;
  /** Number of fragile activities (1 coverage) this occupation can back up */
  redundancyGains: number;
  /** What-if simulation: projected coverage if this occupation is added */
  simulatedCoverage?: SimulatedCoverageRO;
}

/** Coverage info for a single activity */
export interface ActivityCoverageRO {
  activityId: string;
  activityName: string;
  activityType: CareActivityType;
  /** Count of occupations with Y permission for this activity */
  yCount: number;
  /** Count of occupations with LC permission for this activity */
  lcCount: number;
}

/** Summary of coverage across all selected activities */
export interface CoverageSummaryRO {
  /** Activities with 0 coverage (no Y or LC from any team member) */
  gaps: ActivityCoverageRO[];
  /** Activities with exactly 1 coverage (at risk if that person is unavailable) */
  fragile: ActivityCoverageRO[];
  /** Activities with 2+ coverage (safe redundancy) */
  redundant: ActivityCoverageRO[];
  /** Percentage of activities with at least 1 coverage */
  coveragePercent: number;
}

/** Alert types for suggestion quality warnings */
export type SuggestionAlertType = 'LOW_MARGINAL_BENEFIT' | 'REDUNDANT_ONLY' | 'NO_GAP_COVERAGE';

/** Alert for potential issues with a suggestion */
export interface SuggestionAlertRO {
  type: SuggestionAlertType;
  message: string;
  occupationId: string;
  occupationName: string;
}

export interface SuggestionResponseRO {
  suggestions: OccupationSuggestionRO[];
  totalUncoveredActivities: number;
  total: number;
  page: number;
  pageSize: number;
  message?: string;
  /** V2: Coverage summary with gaps/fragile/redundant breakdown */
  summary?: CoverageSummaryRO;
  /** V2: Alerts for potential issues with suggestions */
  alerts?: SuggestionAlertRO[];
}

/** Response for minimum team calculator endpoint */
export interface MinimumTeamResponseRO {
  /** Ordered list of occupation IDs forming the minimum team */
  occupationIds: string[];
  /** Ordered list of occupation names (parallel to IDs) */
  occupationNames: string[];
  /** Coverage percentage achieved by this team */
  achievedCoverage: number;
  /** Activity IDs that remain uncovered (if any) */
  uncoveredActivityIds: string[];
  /** Activity names that remain uncovered (if any) */
  uncoveredActivityNames: string[];
  /** Total number of activities */
  totalActivities: number;
  /** Whether 100% coverage was achieved */
  isFullCoverage: boolean;
}
