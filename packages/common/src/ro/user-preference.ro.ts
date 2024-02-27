import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserPreferenceRO {
  @Expose()
  notShowConfirmDraftRemoval?: boolean;

  constructor(data: Record<string, any>) {
    // data: as UserPreference; can't expose entities to common package
    Object.assign(this, data);
  }
}
