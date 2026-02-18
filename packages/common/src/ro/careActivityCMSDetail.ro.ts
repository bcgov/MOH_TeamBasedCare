import { Exclude, Expose } from 'class-transformer';
import { CareActivityType, ClinicalType } from '../constants';
import { BaseRO } from './base.ro';
import { BundleRO } from './bundle.ro';

@Exclude()
export class CareActivityCMSDetailRO extends BaseRO {
  @Expose()
  activityType!: CareActivityType;

  @Expose()
  clinicalType!: ClinicalType;

  @Expose()
  description!: string;

  @Expose()
  bundle!: BundleRO;

  @Expose()
  templateNames!: string;

  constructor(data: any) {
    super(data);
    this.name = data.displayName ?? data.name;
    if (data.bundle) {
      this.bundle = new BundleRO(data.bundle);
    }
    this.templateNames = data.templateNames ?? '';
  }
}
