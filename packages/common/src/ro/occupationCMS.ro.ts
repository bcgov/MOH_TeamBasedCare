/**
 * Occupation CMS Response Object
 *
 * Extended occupation response for the Content Management System.
 * Includes additional fields needed for the CMS list view such as
 * regulation status, last update info, and related resources.
 *
 * Used by GET /occupations/cms/find endpoint.
 *
 * @module ro/occupationCMS
 */

import { Exclude, Expose } from 'class-transformer';
import { OccupationRO } from './occupation.ro';
import { OccupationRelatedResourceDTO } from '../dto/create-occupation.dto';

/**
 * Response object for occupation list in CMS.
 * Extends base OccupationRO with CMS-specific fields.
 */
@Exclude()
export class OccupationCMSRO extends OccupationRO {
  /** Detailed description of the occupation */
  @Expose()
  description?: string;

  /** Whether the occupation is regulated by a professional body */
  @Expose()
  isRegulated!: boolean;

  /** Array of related resource links */
  @Expose()
  relatedResources?: OccupationRelatedResourceDTO[];

  /** Timestamp of last update */
  @Expose()
  updatedAt!: Date;

  /** Display name or email of the user who last updated this occupation */
  @Expose()
  updatedBy?: string;

  /**
   * Creates an OccupationCMSRO from entity data.
   * @param data - Raw occupation entity data with updatedBy relation
   */
  constructor(data: any) {
    super(data);
    this.description = data.description;
    this.isRegulated = data.isRegulated ?? false;
    this.relatedResources = data.relatedResources;
    this.updatedAt = data.updatedAt;
    this.updatedBy = data.updatedBy?.displayName ?? data.updatedBy?.email ?? undefined;
  }
}
