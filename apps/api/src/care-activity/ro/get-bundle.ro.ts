import { Exclude, Expose } from 'class-transformer';
import { CareActivityType, ClinicalType } from '../../common/constants';
import { Bundle } from '../entity/bundle.entity';
import { CareActivity } from '../entity/care-activity.entity';

@Exclude()
export class CareActivityRO {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  activityType: CareActivityType;

  @Expose()
  clinicalType: ClinicalType;

  constructor(data: CareActivity) {
    Object.assign(this, data);
    this.name = data.displayName;
  }
}

@Exclude()
export class BundleRO {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  careActivities: CareActivityRO[];

  constructor(data: Bundle) {
    Object.assign(this, data);
    this.name = data.displayName;
    this.careActivities = data.careActivities.map(each => new CareActivityRO(each));
  }
}
