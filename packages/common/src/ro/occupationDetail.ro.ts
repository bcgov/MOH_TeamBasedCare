/**
 * Occupation Detail Response Object
 *
 * Detailed occupation response for the CMS edit view.
 * Includes full scope permissions with resolved names for
 * care activities, bundles, and care settings.
 *
 * Used by GET /occupations/cms/:id endpoint.
 *
 * @module ro/occupationDetail
 */

import { OccupationRelatedResourceDTO } from '../dto/create-occupation.dto';

/**
 * Scope permission with resolved entity names.
 * Used in the edit form to display human-readable labels.
 */
export interface ScopePermissionDetailRO {
  /** UUID of the care activity */
  careActivityId: string;
  /** Display name of the care activity */
  careActivityName: string;
  /** UUID of the bundle (care competency) */
  bundleId: string;
  /** Display name of the bundle */
  bundleName: string;
  /** UUID of the care setting (unit) */
  unitId: string;
  /** Display name of the care setting */
  unitName: string;
  /** Permission value: Y, N, or LC */
  permission: string;
}

/**
 * Detailed occupation response for editing.
 * Includes all occupation fields plus scope permissions
 * with resolved names for display in the edit form.
 */
export interface OccupationDetailRO {
  /** Unique identifier */
  id: string;
  /** Internal name (lowercase, no spaces) */
  name: string;
  /** Display name shown in UI */
  displayName: string;
  /** Detailed description */
  description?: string;
  /** Whether regulated by a professional body */
  isRegulated: boolean;
  /** Related resource links */
  relatedResources?: OccupationRelatedResourceDTO[];
  /** Scope permissions with resolved names */
  scopePermissions: ScopePermissionDetailRO[];
  /** Last update timestamp */
  updatedAt?: Date;
  /** Name/email of last updater */
  updatedBy?: string;
}
