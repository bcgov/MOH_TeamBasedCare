import { Exclude, Expose } from 'class-transformer';
import { CareActivityRO } from './careActivity.ro';

@Exclude()
export class CareActivityCMSRO extends CareActivityRO {
  @Expose()
  bundleName!: string;

  @Expose()
  updatedAt!: Date;

  @Expose()
  updatedBy!: string;

  @Expose()
  unitName!: string;


  constructor(data: any) {
    super(data);
    this.bundleName = data.bundle?.displayName ?? this.bundleName;
    this.updatedBy = data.updatedBy?.displayName ?? this.updatedBy;
  }
}
