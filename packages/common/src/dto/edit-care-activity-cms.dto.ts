import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { CareActivityType, ClinicalType } from '../constants';

export class EditCareActivityCMSDTO {
  @IsString()
  @MinLength(1, { message: 'Name is required' })
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(3000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(3000)
  requirementsAndConsiderations?: string;

  @IsUUID()
  bundleId!: string;

  @IsEnum(CareActivityType)
  activityType!: CareActivityType;

  @IsEnum(ClinicalType)
  @IsOptional()
  clinicalType?: ClinicalType;
}
