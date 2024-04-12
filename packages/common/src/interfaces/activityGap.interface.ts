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

export interface ActivityGap {
  headers: ActivityGapHeader[];
  data: ActivityGapData[];
  overview: ActivityGapOverview;
  careSetting?: string;
}
