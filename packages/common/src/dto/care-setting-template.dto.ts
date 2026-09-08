/**
 * Care Setting Template DTOs
 *
 * Data Transfer Objects for care setting template API operations.
 * Used by both frontend and backend for request validation.
 */
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Permissions } from '../constants/permissions';
import { TemplateLevel } from '../constants/templateLevel';

/** Permission assignment for a single activity-occupation pair */
export class TemplatePermissionDTO {
  @IsUUID()
  activityId!: string;

  @IsUUID()
  occupationId!: string;

  @IsEnum(Permissions)
  permission!: Permissions;

  /** Required when `permission` is LC; forced to null otherwise. */
  @IsUUID()
  @IsOptional()
  limitId?: string | null;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  restrictionDescription?: string | null;
}

/** DTO for creating a copy of an existing template */
export class CreateCareSettingTemplateCopyDTO {
  @IsString()
  @MinLength(1, { message: 'Name is required' })
  name!: string;

  @IsEnum(TemplateLevel)
  @IsOptional()
  level?: TemplateLevel;
}

/** DTO for updating a template's name, selections, and permissions */
export class UpdateCareSettingTemplateDTO {
  @IsString()
  @MinLength(1, { message: 'Name is required' })
  @IsOptional()
  name?: string;

  @IsArray()
  @IsUUID('all', { each: true })
  selectedBundleIds!: string[];

  @IsArray()
  @IsUUID('all', { each: true })
  selectedActivityIds!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplatePermissionDTO)
  permissions!: TemplatePermissionDTO[];

  /**
   * The version the client loaded. Optional so existing callers keep
   * validating; when omitted the save proceeds unguarded.
   */
  @IsInt()
  @Min(0)
  @IsOptional()
  expectedVersion?: number;
}

/** DTO for creating a copy with full customization data (deferred copy creation) */
export class CreateCareSettingTemplateCopyFullDTO {
  @IsString()
  @MinLength(1, { message: 'Name is required' })
  name!: string;

  @IsArray()
  @IsUUID('all', { each: true })
  selectedBundleIds!: string[];

  @IsArray()
  @IsUUID('all', { each: true })
  selectedActivityIds!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplatePermissionDTO)
  permissions!: TemplatePermissionDTO[];

  @IsEnum(TemplateLevel)
  @IsOptional()
  level?: TemplateLevel;
}
