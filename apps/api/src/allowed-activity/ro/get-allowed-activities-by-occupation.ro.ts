import { Permissions } from '@tbcm/common';
import { Exclude, Expose } from 'class-transformer';
import { AllowedActivity } from '../entity/allowed-activity.entity';

@Exclude()
export class GetAllowedActivitiesByOccupationRO {
  @Expose()
  id: string;

  @Expose()
  careSetting: string;

  @Expose()
  careActivityName: string;

  @Expose()
  bundleName: string;

  @Expose()
  permission: Permissions;

  constructor(data: AllowedActivity) {
    Object.assign(this, data);

    if (data?.careActivity) {
      this.careActivityName = data.careActivity?.displayName;

      if (data?.careActivity?.bundle) {
        this.bundleName = data.careActivity.bundle?.displayName;
      }

      if (data.careActivity?.careLocations?.length > 0) {
        this.careSetting = data.careActivity?.careLocations?.[0]?.displayName;
      }
    }
  }
}
