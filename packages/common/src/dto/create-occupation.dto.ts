/**
 * Create Occupation DTO
 *
 * Data transfer objects for creating occupations in the CMS.
 * Used by the POST /occupations endpoint.
 *
 * @module dto/create-occupation
 */

import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Permissions } from '../constants';

/**
 * Related resource link for an occupation.
 * Represents external documentation or reference materials.
 *
 * @example
 * {
 *   label: "College of Nurses Guidelines",
 *   link: "https://example.com/guidelines"
 * }
 */
export class OccupationRelatedResourceDTO {
  /** Display label for the resource link */
  @IsString()
  @ValidateIf(o => o.link)
  @MinLength(1, { message: 'Link name is required when link URL is provided' })
  label!: string;

  /** URL to the external resource */
  @IsUrl({}, { message: 'Link must be a valid URL' })
  @ValidateIf(o => o.label)
  link!: string;
}

/**
 * Scope permission for an occupation's care activity.
 * Defines what permission (Y/N/LC) an occupation has for a specific care activity.
 *
 * @example
 * {
 *   careActivityId: "uuid-of-activity",
 *   permission: Permissions.PERFORM
 * }
 */
export class ScopePermissionDTO {
  /** UUID of the care activity */
  @IsUUID()
  careActivityId!: string;

  /** Permission level: Y (perform), N (cannot perform), LC (limits/conditions) */
  @IsEnum(Permissions)
  permission!: Permissions;
}

/**
 * DTO for creating a new occupation.
 * Includes general details, related resources, and scope permissions.
 *
 * @example
 * {
 *   name: "Registered Nurse",
 *   description: "Healthcare professional...",
 *   isRegulated: true,
 *   relatedResources: [...],
 *   scopePermissions: [...]
 * }
 */
export class CreateOccupationDTO {
  /** Name of the occupation (must be unique) */
  @IsString()
  @MinLength(1, { message: 'Name is required' })
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name!: string;

  /** Detailed description of the occupation */
  @IsString()
  @MinLength(1, { message: 'Description is required' })
  @MaxLength(4096, { message: 'Description must not exceed 4096 characters' })
  description!: string;

  /** Whether the occupation is regulated by a professional body */
  @IsBoolean()
  isRegulated!: boolean;

  /** Optional array of related resource links */
  @IsArray()
  @ArrayMaxSize(50, { message: 'Related resources cannot exceed 50 items' })
  @ValidateNested({ each: true })
  @Type(() => OccupationRelatedResourceDTO)
  @IsOptional()
  relatedResources?: OccupationRelatedResourceDTO[];

  /** Optional array of scope permissions for care activities */
  @IsArray()
  @ArrayMaxSize(1000, { message: 'Scope permissions cannot exceed 1000 items' })
  @ValidateNested({ each: true })
  @Type(() => ScopePermissionDTO)
  @IsOptional()
  scopePermissions?: ScopePermissionDTO[];
}
