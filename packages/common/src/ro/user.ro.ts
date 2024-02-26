import { Exclude, Expose } from 'class-transformer';
import { Role } from '../constants';
import { UserPreferenceRO } from './user-preference.ro';

@Exclude()
export class UserRO {
  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  roles?: Role[];

  @Expose()
  displayName?: string;

  @Expose()
  organization?: string;

  @Expose()
  revokedAt?: Date;

  @Expose()
  userPreference?: UserPreferenceRO;

  constructor(data: Record<string, any>) {
    this.userPreference = new UserPreferenceRO(data.userPreference);

    // data: as User; can't expose entities to common package
    Object.assign(this, data);
  }
}
