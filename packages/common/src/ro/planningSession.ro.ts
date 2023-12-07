import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class PlanningSessionRO {
  @Expose()
  id!: string;

  @Expose()
  profileOption?: string;

  @Expose()
  careLocationId?: string;

  @Expose()
  updatedAt!: Date;

  constructor(data: any) {
    Object.assign(this, data);
  }
}
