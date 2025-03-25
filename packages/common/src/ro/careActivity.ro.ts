import { Exclude, Expose } from 'class-transformer';
import { CareActivityType, ClinicalType } from '../constants';
import { BaseRO } from './base.ro';

@Exclude()
export class CareActivityRO extends BaseRO {
  @Expose()
  activityType!: CareActivityType;

  @Expose()
  clinicalType!: ClinicalType;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(data: any) {
    super(data);
    Object.assign(this, data);
    this.name = data.displayName ?? data.name;
  }
}
