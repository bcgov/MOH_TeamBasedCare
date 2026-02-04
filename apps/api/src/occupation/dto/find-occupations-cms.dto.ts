/**
 * Find Occupations CMS DTO
 *
 * Query parameters for the GET /occupations/cms/find endpoint.
 * Supports pagination, search, and sorting for the occupation
 * list in the Content Management System.
 *
 * @module occupation/dto/find-occupations-cms
 */

import { IsEnum, IsOptional, IsString, MaxLength, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OccupationsCMSFindSortKeys, SortOrder } from '@tbcm/common';

/**
 * Query DTO for finding occupations in CMS.
 *
 * @example
 * GET /occupations/cms/find?searchText=nurse&page=1&pageSize=10&sortBy=displayName&sortOrder=ASC
 */
export class FindOccupationsCMSDto {
  /** Search text to filter by name or description (case-insensitive) */
  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  searchText?: string;

  /** Page number (1-indexed) */
  @Type(() => Number)
  @Min(1)
  page: number = 1;

  /** Number of items per page (max 50) */
  @Type(() => Number)
  @Min(1)
  @Max(50)
  pageSize: number = 10;

  /** Field to sort by */
  @IsEnum(OccupationsCMSFindSortKeys)
  @IsOptional()
  sortBy?: OccupationsCMSFindSortKeys;

  /** Sort direction (ASC or DESC) */
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder;
}
