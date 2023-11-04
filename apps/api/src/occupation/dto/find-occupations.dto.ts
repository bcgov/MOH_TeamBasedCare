import { IsNumber, IsString, IsOptional, IsEnum, Length, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { OccupationsFindSortKeys, SortOrder } from '@tbcm/common';

export class FindOccupationsDto {
  @ApiProperty({
    required: false,
    type: String,
    example: 'icu',
  })
  @IsString()
  @IsOptional()
  @Length(0, 100)
  @Transform(({ value }) => value?.trim())
  readonly searchText?: string = '';

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
    type: String,
    example: 'displayName',
  })
  @IsString()
  @IsEnum(OccupationsFindSortKeys)
  @IsOptional()
  readonly sortBy?: OccupationsFindSortKeys;

  @ApiProperty({
    required: false,
    type: SortOrder,
    example: SortOrder.DESC,
  })
  @IsString()
  @IsEnum(SortOrder)
  @IsOptional()
  readonly sortOrder?: SortOrder;
}
