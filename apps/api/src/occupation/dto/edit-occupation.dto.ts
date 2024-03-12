import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OccupationRelatedResource } from './occupation-related-resource.dto';

export class EditOccupationDTO {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isRegulated?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OccupationRelatedResource)
  @IsOptional()
  relatedResources?: OccupationRelatedResource[];
}
