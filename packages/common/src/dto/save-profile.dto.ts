import { IsOptional, IsString, Length, ValidateIf } from 'class-validator';
import { ProfileOptions } from '../constants';

export class SaveProfileDTO {
  @IsString()
  @Length(1, 256, { message: 'Please select profile type' })
  profile!: string;

  @IsOptional()
  @ValidateIf(e => e.profile === ProfileOptions.GENERIC)
  @Length(1, 256, { message: 'Please select care location' })
  careLocation?: string;
}
