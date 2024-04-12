import { Exclude, Expose } from 'class-transformer';
import _ from 'lodash';

@Exclude()
export class PlanningSessionCareSettingRO {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(data: any) {
    Object.assign(this, data);

    /** Bundles */
    const bundles: PlanningSessionBundleRO[] = [];
    if (data?.careActivity?.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    /** care setting */

    this.careSetting = new PlanningSessionCareSettingRO(data.careLocation);
  }
}
