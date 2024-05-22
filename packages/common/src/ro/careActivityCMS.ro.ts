import { Exclude, Expose } from 'class-transformer';
import { CareActivityRO } from './careActivity.ro';

@Exclude()
export class CareActivityCMSRO extends CareActivityRO {
  @Expose()
  bundleName: string;

  @Expose()
  updatedAt!: Date;

  @Expose()
  updatedBy: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(data: any) {
    super(data);

    this.bundleName = data.bundle?.displayName;
    this.updatedBy = data.updatedBy?.displayName;
  }
}
