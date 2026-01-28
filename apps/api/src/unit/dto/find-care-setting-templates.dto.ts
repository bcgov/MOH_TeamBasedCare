import { IsNumber, IsString, IsOptional, IsEnum, Length, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CareSettingsCMSFindSortKeys, SortOrder } from '@tbcm/common';

export class FindCareSettingTemplatesDto {
  @ApiProperty({
    required: false,
    type: String,
    example: 'Acute care',
  })
  @IsString()
  @IsOptional()
  @Length(0, 100)
  @Transform(({ value }) => value?.trim())
  readonly searchText?: string = '';

  @ApiProperty({
    required: false,
    type: Number,
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Math.floor(Math.max(Number(value), 1)))
  readonly page: number = 1;

  @ApiProperty({
    required: false,
    type: Number,
    example: 10,
  })
  @IsNumber()
  @IsOptional()
  @Max(50)
  @Transform(({ value }) => Math.floor(Math.max(Number(value), 1)))
  readonly pageSize: number = 10;

  @ApiProperty({
    required: false,
    type: CareSettingsCMSFindSortKeys,
    example: CareSettingsCMSFindSortKeys.NAME,
  })
  @IsString()
  @IsEnum(CareSettingsCMSFindSortKeys)
  @IsOptional()
  readonly sortBy?: string;

  @ApiProperty({
    required: false,
    type: SortOrder,
    example: SortOrder.ASC,
  })
  @IsString()
  @IsEnum(SortOrder)
  @IsOptional()
  readonly sortOrder?: string;
}
