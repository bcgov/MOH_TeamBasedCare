import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class BaseRO {
  @Expose()
  id!: string;

  @Expose()
  displayName?: string;

  @Expose()
  name?: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(data: any) {
    Object.assign(this, data);
  }
}
