import {
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  Length,
  Max,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CareActivitiesFindSortKeys, SortOrder } from '@tbcm/common';

export class FindCareActivitiesDto {
  @ApiProperty({
    required: false,
    type: String,
    example: 'Screen patients',
  })
  @IsString()
  @IsOptional()
  @Length(0, 100)
  @Transform(({ value }) => value?.trim())
  readonly searchText?: string = '';

  /** Care setting template id; narrows results to the activities that template selected */
  @ApiProperty({
    required: false,
    type: String,
    example: 'd2f1b2a0-0000-4000-8000-000000000000',
  })
  @IsString()
  @IsOptional()
  // a repeated query parameter arrives as an array; trimming it blindly would throw a 500
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  // an empty value means "all care settings"; anything else has to be a real template id,
  // otherwise Postgres rejects the uuid comparison with a 500
  @ValidateIf(o => !!o.careSetting)
  @IsUUID()
  readonly careSetting?: string = '';

  @ApiProperty({
    required: false,
    type: String,
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Math.floor(Math.max(Number(value), 1)))
  readonly page: number = 1;

  @ApiProperty({
    required: false,
    type: String,
    example: 12,
  })
  @IsNumber()
  @IsOptional()
  @Max(50)
  @Transform(({ value }) => Math.floor(Math.max(Number(value), 1)))
  readonly pageSize: number = 10;

  @ApiProperty({
    required: false,
    type: CareActivitiesFindSortKeys,
    example: CareActivitiesFindSortKeys.DISPLAY_NAME,
  })
  @IsString()
  @IsEnum(CareActivitiesFindSortKeys)
  @IsOptional()
  readonly sortBy?: string;

  @ApiProperty({
    required: false,
    type: SortOrder,
    example: SortOrder.DESC,
  })
  @IsString()
  @IsEnum(SortOrder)
  @IsOptional()
  readonly sortOrder?: string;
}
