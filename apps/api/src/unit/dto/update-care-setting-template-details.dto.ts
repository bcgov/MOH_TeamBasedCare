import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { TemplateLevel } from '@tbcm/common';

/**
 * Payload for editing a template's name and level from the details dialog.
 *
 * Unlike the wizard save, `expectedVersion` is required here: this endpoint
 * exists only for the web client, so there are no legacy callers to keep
 * working, and an unguarded name or level change is exactly the kind of silent
 * overwrite the version token exists to prevent.
 */
export class UpdateCareSettingTemplateDetailsDto {
  @ApiProperty({ example: 'Emergency Department - Interior Health' })
  @IsString()
  @MinLength(1, { message: 'Name is required' })
  @MaxLength(255)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  readonly name!: string;

  @ApiProperty({ enum: TemplateLevel, example: TemplateLevel.SITE })
  @IsEnum(TemplateLevel)
  readonly level!: TemplateLevel;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(0)
  readonly expectedVersion!: number;
}
