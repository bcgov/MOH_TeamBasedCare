import { IsArray, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { AllowedActivityDTO } from './allowed-activity-dto';
import { CareActivityType, ClinicalType } from '../constants';

export class EditCareActivityDTO {
  @IsString()
  @MinLength(1, { message: 'Name is required' })
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  bundleId!: string;

  @IsUUID()
  unitId!: string;

  @IsEnum(CareActivityType)
  activityType!: CareActivityType;

  @IsEnum(ClinicalType)
  @IsOptional()
  clinicalType?: ClinicalType;

  @IsArray()
  allowedActivities!: AllowedActivityDTO[];
}
