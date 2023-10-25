import { IsEnum, IsUUID } from 'class-validator';
import { ProfileOptions } from '../constants';

export class SaveProfileDTO {
  @IsEnum(ProfileOptions, { message: 'Please select a valid profile type' })
  profileOption!: string;

  @IsUUID('4', { message: 'Please select a valid care setting' })
  careLocation!: string;
}
