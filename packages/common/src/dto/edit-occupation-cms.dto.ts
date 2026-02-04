/**
 * Edit Occupation CMS DTO
 *
 * Data transfer object for updating occupations in the CMS.
 * All fields are optional to support partial updates.
 * Used by the PATCH /occupations/cms/:id endpoint.
 *
 * @module dto/edit-occupation-cms
 */

import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OccupationRelatedResourceDTO, ScopePermissionDTO } from './create-occupation.dto';

/**
 * DTO for editing an existing occupation.
 * All fields are optional - only provided fields will be updated.
 * Scope permissions are upserted (created or updated) based on the
 * combination of occupationId + careActivityId + unitId.
 *
 * @example
 * {
 *   name: "Updated Name",
 *   scopePermissions: [
 *     { careActivityId: "...", unitId: "...", permission: "Y" }
 *   ]
 * }
 */
export class EditOccupationCMSDTO {
  /** Updated name (must be unique if provided) */
  @IsString()
  @MinLength(1, { message: 'Name is required' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  @IsOptional()
  name?: string;

  /** Updated description */
  @IsString()
  @MinLength(1, { message: 'Description is required' })
  @MaxLength(4096, { message: 'Description must not exceed 4096 characters' })
  @IsOptional()
  description?: string;

  /** Updated regulation status */
  @IsBoolean()
  @IsOptional()
  isRegulated?: boolean;

  /** Updated related resources (replaces existing) */
  @IsArray()
  @ArrayMaxSize(50, { message: 'Related resources cannot exceed 50 items' })
  @ValidateNested({ each: true })
  @Type(() => OccupationRelatedResourceDTO)
  @IsOptional()
  relatedResources?: OccupationRelatedResourceDTO[];

  /** Scope permissions to upsert */
  @IsArray()
  @ArrayMaxSize(1000, { message: 'Scope permissions cannot exceed 1000 items' })
  @ValidateNested({ each: true })
  @Type(() => ScopePermissionDTO)
  @IsOptional()
  scopePermissions?: ScopePermissionDTO[];
}
