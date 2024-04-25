import { Exclude, Expose } from 'class-transformer';
import { CareActivityRO } from './careActivity.ro';
import { BundleRO } from './bundle.ro';

@Exclude()
export class CareActivityCMSRO extends CareActivityRO {
  @Expose()
  bundle!: BundleRO;

  @Expose()
  updatedAt!: Date;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(data: any) {
    super(data);

    this.bundle = new BundleRO(data.bundle);
  }
}
