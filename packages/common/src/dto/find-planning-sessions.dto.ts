import { IsEnum, IsNumber, IsOptional, IsString, Length, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { PlanningSessionsFindSortKeys, SortOrder } from '../constants';

export class FindPlanningSessionsDto {
  @IsString()
  @IsOptional()
  @Length(0, 100)
  @Transform(({ value }) => value?.trim())
  readonly searchText?: string = '';

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Math.floor(Math.max(Number(value), 1)))
  readonly page: number = 1;

  @IsNumber()
  @IsOptional()
  @Max(50)
  @Transform(({ value }) => Math.floor(Math.max(Number(value), 1)))
  readonly pageSize: number = 10;

  @IsString()
  @IsEnum(PlanningSessionsFindSortKeys)
  @IsOptional()
  readonly sortBy?: string;

  @IsString()
  @IsEnum(SortOrder)
  @IsOptional()
  readonly sortOrder?: string;
}
