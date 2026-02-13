import { IsNumber, IsString, IsOptional, IsEnum, IsUUID, Length, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { OccupationalScopeOfPracticeSortKeys, Permissions, SortOrder } from '@tbcm/common';

export class GetAllowedActivitiesByOccupationDto {
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
    type: OccupationalScopeOfPracticeSortKeys,
    example: OccupationalScopeOfPracticeSortKeys.CARE_ACTIVITY_NAME,
  })
  @IsString()
  @IsEnum(OccupationalScopeOfPracticeSortKeys)
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

  @ApiProperty({
    required: false,
    type: Permissions,
    example: Permissions.LIMITS,
  })
  @IsString()
  @IsEnum(Permissions)
  @IsOptional()
  readonly filterByPermission?: string;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Filter by Care Competencies (bundle) ID',
  })
  @IsUUID()
  @IsOptional()
  readonly bundleId?: string;
}
