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

export interface ActivityGapOverview {
  inScope?: string;
  limits?: string;
  outOfScope?: string;
}

export interface ActivityGapPermissionDetail {
  bundleName: string;
  /** Zero-based index in this bundle's returned careActivities array, including rows without details. */
  activityIndex: number;
  activityName: string;
  occupationName: string;
  limitName?: string;
  restrictionDescription?: string;
}

export interface ActivityGap {
  headers: ActivityGapHeader[];
  data: ActivityGapData[];
  overview: ActivityGapOverview;
  careSetting?: string;
  /** Kept separate from the permission-code matrix used by spreadsheet exports. */
  permissionDetails?: ActivityGapPermissionDetail[];
}
