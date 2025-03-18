import { Exclude, Expose } from 'class-transformer';
import { CareActivityRO } from './careActivity.ro';
import { BaseRO } from './base.ro';

@Exclude()
export class BundleRO extends BaseRO {
  @Expose()
  careActivities?: CareActivityRO[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(data: any) {
    super(data);
    this.name = data.displayName;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.careActivities = data.careActivities?.map((each: any) => new CareActivityRO(each));
  }
}
