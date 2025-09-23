import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class BaseRO {
  @Expose()
  id!: string;

  @Expose()
  displayName?: string;

  @Expose()
  name?: string;

  constructor(data: any) {
    Object.assign(this, data);
  }
}
