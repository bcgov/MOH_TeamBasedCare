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
    type: OccupationsFindSortKeys,
    example: OccupationsFindSortKeys.DISPLAY_NAME,
  })
  @IsString()
  @IsEnum(OccupationsFindSortKeys)
  @IsOptional()
  readonly sortBy?: any; // TODO - fix here - explicitly changing type to "any" for now to fix the Runtime.ImportModuleError after file compiles to .js and not handle @tbcm/common path properly in the _OPENAPI_METADATA_FACTORY section

  @ApiProperty({
    required: false,
    type: SortOrder,
    example: SortOrder.DESC,
  })
  @IsString()
  @IsEnum(SortOrder)
  @IsOptional()
  readonly sortOrder?: any; // TODO - fix here - explicitly changing type to "any" for now to fix the Runtime.ImportModuleError after file compiles to .js and not handle @tbcm/common path properly in the _OPENAPI_METADATA_FACTORY section
}
