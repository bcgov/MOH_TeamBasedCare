import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class GeneralKPIsRO {
  @Expose()
  totalUsers!: number;

  @Expose()
  activeUsers!: number;

  @Expose()
  totalCarePlans!: number;

  constructor(data: Partial<GeneralKPIsRO>) {
    Object.assign(this, data);
  }
}

@Exclude()
export class CarePlansBySettingRO {
  @Expose()
  careSettingId!: string;

  @Expose()
  careSettingName!: string;

  @Expose()
  healthAuthority!: string;

  @Expose()
  count!: number;

  constructor(data: Partial<CarePlansBySettingRO>) {
    Object.assign(this, data);
  }
}

@Exclude()
export class KPIsOverviewRO {
  @Expose()
  general!: GeneralKPIsRO;

  @Expose()
  carePlansBySetting!: CarePlansBySettingRO[];

  constructor(data: Partial<KPIsOverviewRO>) {
    Object.assign(this, data);
  }
}
