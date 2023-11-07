import { Exclude, Expose } from 'class-transformer';
import { Occupation } from '../entity/occupation.entity';

@Exclude()
export class OccupationRO {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  isRegulated: string;

  constructor(data: Occupation) {
    Object.assign(this, data);
    this.name = data.displayName;
  }
}
