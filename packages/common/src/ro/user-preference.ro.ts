import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserPreferenceRO {
  @Expose()
  notShowConfirmDraftRemoval?: boolean;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(data: Record<string, any>) {
    // data: as UserPreference; can't expose entities to common package
    Object.assign(this, data);
  }
}
