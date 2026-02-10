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

export interface SuggestionResponseRO {
  suggestions: OccupationSuggestionRO[];
  totalUncoveredActivities: number;
  total: number;
  page: number;
  pageSize: number;
  message?: string;
  /** V2: Coverage summary with gaps/fragile/redundant breakdown */
  summary?: CoverageSummaryRO;
}
