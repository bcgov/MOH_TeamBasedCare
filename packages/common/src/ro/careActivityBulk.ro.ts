export class CareActivityBulkROError {
  message!: string;
  rowNumber?: number[];
}

export class DuplicateInfo {
  count!: number;
  names!: string[];
  rowNumbers?: number[]; // Optional - not currently used by frontend
}

export class MissingOccupationsInfo {
  count!: number;
  names!: string[];
}

export class MissingIdsInfo {
  count!: number;
  names!: string[]; // Activity names (first 10 for display)
  rowNumbers!: number[]; // All affected row numbers
  matchingExistingCount!: number; // How many stale-ID rows match existing activities by name
}

export class CareActivityBulkRO {
  add?: number;
  edit?: number;
  total!: number;
  newOccupations?: string[];
  errors!: CareActivityBulkROError[];
  duplicates?: DuplicateInfo;
  missingOccupations?: MissingOccupationsInfo;
  missingIds?: MissingIdsInfo;
}
