import { Exclude, Expose } from 'class-transformer';
import { Bundle } from '../entity/bundle.entity';
import { CareActivityRO } from '@tbcm/common';

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
