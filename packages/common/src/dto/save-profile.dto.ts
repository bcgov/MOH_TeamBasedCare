import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ProfileOptions } from '../constants';

export class SaveProfileDTO {
  @IsEnum(ProfileOptions, { message: 'Please select a valid profile type' })
  profileOption!: string;

  @IsOptional()
  @IsUUID('4', { message: 'Please select a valid care location' })
  careLocation?: string;
}
