/* eslint-disable @typescript-eslint/no-explicit-any */
import { Exclude, Expose } from 'class-transformer';
import { CareActivityType, ClinicalType } from '../constants';
import { AllowedActivityRO } from './allowedActivity.ro';
import { BaseRO } from './base.ro';
import { UnitRO } from './unit.ro';
import { BundleRO } from './bundle.ro';

@Exclude()
export class CareActivityDetailRO extends BaseRO {
  @Expose()
  activityType!: CareActivityType;

  @Expose()
  allowedActivities!: AllowedActivityRO[];

  @Expose()
  careLocation!: UnitRO;

  @Expose()
  clinicalType!: ClinicalType;

  @Expose()
  description!: string;

  @Expose()
  bundle!: BundleRO;

  constructor(data: any) {
    super(data);
    this.name = data.displayName ?? data.name;

    if (data.allowedActivities) {
      this.allowedActivities = data.allowedActivities.map(
        (allowedActivity: any) => new AllowedActivityRO(allowedActivity),
      );
    }
    if (data.careLocations?.length) {
      this.careLocation = new UnitRO(data.careLocations[0]);
    }
    if (this.bundle) {
      this.bundle = new BundleRO(data.bundle);
    }
  }
}
