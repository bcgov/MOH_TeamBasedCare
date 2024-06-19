import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsNotEmptyObject,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';

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
  headers!: string[];

  @ValidateNested({ each: true })
  @Type(() => CareActivityBulkData)
  data!: CareActivityBulkData[];
}
