/**
 * Care Setting Template DTOs
 *
 * Data Transfer Objects for care setting template API operations.
 * Used by both frontend and backend for request validation.
 */
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Permissions } from '../constants/permissions';

/** Permission assignment for a single activity-occupation pair */
export class TemplatePermissionDTO {
  @IsUUID()
  activityId!: string;

  @IsUUID()
  occupationId!: string;

  @IsEnum(Permissions)
  permission!: Permissions;
}

/** DTO for creating a copy of an existing template */
export class CreateCareSettingTemplateCopyDTO {
  @IsString()
  @MinLength(1, { message: 'Name is required' })
  name!: string;
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
}
