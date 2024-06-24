export class CareActivityBulkROError {
  message!: string;
  rowNumber?: number[];
}

export class CareActivityBulkRO {
  errors!: CareActivityBulkROError[];
  careActivitiesCount!: number;
}
