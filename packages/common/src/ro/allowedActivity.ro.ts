/* eslint-disable @typescript-eslint/no-explicit-any */
import { Exclude, Expose } from 'class-transformer';
import { BaseRO } from './base.ro';
import { UnitRO } from './unit.ro';
import { OccupationRO } from './occupation.ro';
import { CareActivityRO } from './careActivity.ro';
import { Permissions } from '../constants';

@Exclude()
export class AllowedActivityRO extends BaseRO {
  @Expose()
  unit!: UnitRO;

  @Expose()
  occupation!: OccupationRO;

  @Expose()
  careActivity?: CareActivityRO;

  @Expose()
  permission!: Permissions | 'N';

  constructor(data: any) {
    super(data);
    this.occupation = new OccupationRO(data.occupation);
    this.unit = new UnitRO(data.unit);
  }
}
