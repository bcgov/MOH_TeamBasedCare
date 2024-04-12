import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UnitRO {
  @Expose()
  id!: string;

  @Expose()
  displayName!: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(data: any) {
    Object.assign(this, data);
  }
}
