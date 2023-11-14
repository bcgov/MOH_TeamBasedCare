import { Exclude, Expose } from 'class-transformer';
import { OccupationRelatedResource } from '../dto/occupation-related-resource.dto';
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

  @Expose()
  relatedResources?: OccupationRelatedResource;

  constructor(data: Occupation) {
    Object.assign(this, data);
    this.name = data.displayName;
  }
}
