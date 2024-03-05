import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CareActivityType, ClinicalType } from '@tbcm/common';

export class EditCareActivityDTO {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  bundle?: string;

  @IsEnum(CareActivityType)
  @IsOptional()
  activityType?: CareActivityType;

  @IsEnum(ClinicalType)
  @IsOptional()
  clinicalType?: ClinicalType;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  careLocations?: string[];
}
