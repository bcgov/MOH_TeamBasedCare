import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CareActivitiesCMSFindSortKeys } from '@tbcm/common';
import { FindCareActivitiesDto } from './find-care-activities.dto';

export class FindCareActivitiesCMSDto extends FindCareActivitiesDto {
  @ApiProperty({
    required: false,
    type: CareActivitiesCMSFindSortKeys,
    example: CareActivitiesCMSFindSortKeys.DISPLAY_NAME,
  })
  @IsString()
  @IsEnum(CareActivitiesCMSFindSortKeys)
  @IsOptional()
  readonly sortBy?: string;
}
