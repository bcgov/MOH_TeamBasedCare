/**
 * Occupation Detail Response Object
 *
 * Detailed occupation response for the CMS edit view.
 * Transforms the Occupation entity with its AllowedActivity relations
 * into a flat structure suitable for the frontend edit form.
 *
 * Used by GET /occupations/cms/:id endpoint.
 *
 * @module occupation/ro/occupation-detail
 */

import { Exclude, Expose, Type } from 'class-transformer';
import { OccupationRelatedResourceDTO } from '@tbcm/common';

/**
 * Scope permission with resolved entity names.
 * Maps from AllowedActivity entity to a flat structure with human-readable names.
 */
class ScopePermissionDetailRO {
  /** UUID of the care activity */
  @Expose()
  careActivityId!: string;

  /** Display name of the care activity */
  @Expose()
  careActivityName!: string;

  /** UUID of the bundle (care competency) */
  @Expose()
  bundleId!: string;

  /** Display name of the bundle */
  @Expose()
  bundleName!: string;

  /** UUID of the care setting (unit) */
  @Expose()
  unitId!: string;

  /** Display name of the care setting */
  @Expose()
  unitName!: string;

  /** Permission value: Y, N, or LC */
  @Expose()
  permission!: string;
}

/**
 * Detailed occupation response for the CMS edit form.
 * Includes all occupation fields plus scope permissions with resolved names.
 *
 * The scopePermissions array is derived from the AllowedActivity relations,
 * flattening the nested entity structure into a simple array of objects.
 */
@Exclude()
export class OccupationDetailRO {
  /** Unique identifier */
  @Expose()
  id!: string;

  /** Internal name (normalized) */
  @Expose()
  name!: string;

  /** Display name shown in UI */
  @Expose()
  displayName!: string;

  /** Detailed description */
  @Expose()
  description?: string;

  /** Whether regulated by a professional body */
  @Expose()
  isRegulated!: boolean;

  /** Related resource links */
  @Expose()
  @Type(() => OccupationRelatedResourceDTO)
  relatedResources?: OccupationRelatedResourceDTO[];

  /** Scope permissions with resolved entity names */
  @Expose()
  @Type(() => ScopePermissionDetailRO)
  scopePermissions!: ScopePermissionDetailRO[];

  /** Last update timestamp */
  @Expose()
  updatedAt?: Date;

  /** Name/email of last updater */
  @Expose()
  updatedBy?: string;

  /**
   * Creates an OccupationDetailRO from entity data.
   * Transforms AllowedActivity relations into flat scope permissions.
   *
   * @param data - Raw occupation entity with allowedActivities relation loaded
   */
  constructor(data: any) {
    this.id = data.id;
    this.name = data.name;
    this.displayName = data.displayName;
    this.description = data.description;
    this.isRegulated = data.isRegulated ?? false;
    this.relatedResources = data.relatedResources;
    this.updatedAt = data.updatedAt;
    this.updatedBy = data.updatedBy?.displayName ?? data.updatedBy?.email;

    // Map allowed activities to scope permissions with resolved names
    this.scopePermissions = (data.allowedActivities || []).map((aa: any) => ({
      careActivityId: aa.careActivity?.id,
      careActivityName: aa.careActivity?.displayName,
      bundleId: aa.careActivity?.bundle?.id,
      bundleName: aa.careActivity?.bundle?.displayName,
      unitId: aa.unit?.id,
      unitName: aa.unit?.displayName,
      permission: aa.permission,
    }));
  }
}
