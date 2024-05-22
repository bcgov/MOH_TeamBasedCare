import { Exclude, Expose } from 'class-transformer';
import { CareActivityRO } from './careActivity.ro';

@Exclude()
export class BundleRO {
  @Expose()
  id!: string;

  @Expose()
  name: string;

  @Expose()
  careActivities?: CareActivityRO[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(data: any) {
    Object.assign(this, data);
    this.name = data.displayName;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.careActivities = data.careActivities?.map((each: any) => new CareActivityRO(each));
  }
}
