import { Exclude, Expose } from 'class-transformer';
import { CareActivityType, ClinicalType } from '../constants';

@Exclude()
export class CareActivityRO {
  @Expose()
  id!: string;

  @Expose()
  name: string;

  @Expose()
  activityType!: CareActivityType;

  @Expose()
  clinicalType!: ClinicalType;

  constructor(data: any) {
    // data: as CareActivity; can't expose entities to common package
    Object.assign(this, data);
    this.name = data.displayName;
  }
}
