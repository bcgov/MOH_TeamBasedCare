import { IsString, IsOptional, IsEnum, Length } from 'class-validator';
import { Transform } from 'class-transformer';
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

  @ApiProperty({
    required: false,
    type: String,
    example: 'Acute care medicine',
  })
  @IsString()
  @IsOptional()
  @Length(0, 100)
  @Transform(({ value }) => value?.trim())
  readonly careSetting?: string = '';
}
