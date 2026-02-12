export interface ActivityGapHeader {
  title: string;
  description: string;
}

export interface ActivityGapCareActivity {
  [key: string]: string;
}

export interface ActivityGapData {
  [key: string]: string | number | Array<ActivityGapCareActivity>;
}

export interface ActivityCoverageStats {
  totalActivities: number;
  gapsCount: number; // 0 coverage
  fragileCount: number; // 1 coverage
  redundantCount: number; // 2+ coverage
  coveragePercent: number; // % with ≥1 coverage
}

export interface ActivityGapOverview {
  inScope?: string;
  limits?: string;
  outOfScope?: string;
  coverage?: ActivityCoverageStats;
}

export interface ActivityGap {
  headers: ActivityGapHeader[];
  data: ActivityGapData[];
  overview: ActivityGapOverview;
  careSetting?: string;
}
