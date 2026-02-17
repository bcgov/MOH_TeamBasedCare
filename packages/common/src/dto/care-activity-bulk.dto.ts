import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DuplicateHandling } from '../constants';

export class CareActivityBulkData {
  @IsObject()
  @IsNotEmptyObject()
  rowData!: Record<string, string>;

  @IsNumber()
  rowNumber!: number;
}

export class CareActivityBulkDTO {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  headers!: string[];

  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => CareActivityBulkData)
  data!: CareActivityBulkData[];

  @IsEnum(DuplicateHandling)
  @IsOptional()
  duplicateHandling?: DuplicateHandling;

  @IsBoolean()
  @IsOptional()
  proceedWithMissingOccupations?: boolean;

  @IsBoolean()
  @IsOptional()
  proceedWithStaleIds?: boolean;
}
