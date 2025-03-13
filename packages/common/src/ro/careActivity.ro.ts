import { Exclude, Expose } from 'class-transformer';
import { CareActivityType, ClinicalType } from '../constants';

@Exclude()
export class CareActivityRO {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  activityType!: CareActivityType;

  @Expose()
  clinicalType!: ClinicalType;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(data: any) {
    Object.assign(this, data);
  }
}
