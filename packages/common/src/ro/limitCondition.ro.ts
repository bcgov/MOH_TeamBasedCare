/**
 * Limits and Conditions catalogue entry.
 *
 * Read-only from this feature's perspective; the catalogue is maintained
 * outside the care settings screens.
 */
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class LimitConditionRO {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  description?: string | null;

  constructor(data: Partial<LimitConditionRO>) {
    Object.assign(this, data);
  }
}
