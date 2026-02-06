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
}

export interface SuggestionResponseRO {
  suggestions: OccupationSuggestionRO[];
  totalUncoveredActivities: number;
  total: number;
  page: number;
  pageSize: number;
  message?: string;
}
