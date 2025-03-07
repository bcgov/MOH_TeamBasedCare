export class CareActivityBulkROError {
  message!: string;
  rowNumber?: number[];
}

export class CareActivityBulkRO {
  add?: number;
  edit?: number;
  total!: number;
  newOccupations?: string[];
  errors!: CareActivityBulkROError[];
}
