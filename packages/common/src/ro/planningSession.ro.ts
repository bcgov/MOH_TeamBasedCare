import { Exclude, Expose } from 'class-transformer';
import _ from 'lodash';

@Exclude()
export class PlanningSessionCareSettingRO {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  constructor(data: any) {
    Object.assign(this, { id: '', name: '' }, data);
    this.name = data.displayName;
  }
}

@Exclude()
export class PlanningSessionBundleRO {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  constructor(data: any) {
    Object.assign(this, data);
    this.name = data.displayName;
  }
}

@Exclude()
export class PlanningSessionRO {
  @Expose()
  id!: string;

  @Expose()
  profileOption?: string;

  @Expose()
  careSetting!: PlanningSessionCareSettingRO;

  @Expose()
  updatedAt!: Date;

  @Expose()
  bundles!: PlanningSessionBundleRO[];

  constructor(data: any) {
    Object.assign(this, data);

    /** Bundles */
    const bundles: PlanningSessionBundleRO[] = [];
    if (data?.careActivity?.length > 0) {
      data.careActivity.forEach((ca: any) => {
        if (ca.bundle) {
          bundles.push(new PlanningSessionBundleRO(ca.bundle));
        }
      });
    }
    this.bundles = _.sortBy(
      _.uniqBy(bundles, bundle => bundle.id),
      'name',
    );

    /** care setting — use template ID when available so dropdown can match */
    const careSettingSource = data.careSettingTemplate
      ? { ...data.careLocation, id: data.careSettingTemplate.id }
      : data.careLocation;
    this.careSetting = new PlanningSessionCareSettingRO(careSettingSource);
  }
}
