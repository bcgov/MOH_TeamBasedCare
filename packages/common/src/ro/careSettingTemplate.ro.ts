/**
 * Care Setting Template Response Objects
 *
 * RO classes for serializing care setting template data in API responses.
 * Uses class-transformer decorators for controlled field exposure.
 */
import { Exclude, Expose } from 'class-transformer';
import { BaseRO } from './base.ro';
import { Permissions } from '../constants/permissions';

/** Basic template info for list views */
@Exclude()
export class CareSettingTemplateRO extends BaseRO {
  @Expose()
  isMaster!: boolean;

  @Expose()
  parentId?: string;

  @Expose()
  parentName?: string;

  @Expose()
  unitId!: string;

  @Expose()
  unitName!: string;

  @Expose()
  updatedAt!: Date;

  constructor(data: any) {
    super(data);
    this.name = data.name ?? this.name;
    this.displayName = data.name ?? this.displayName;
    this.parentId = data.parent?.id ?? this.parentId;
    this.parentName = data.parent?.name ?? (data.isMaster ? 'Master' : this.parentName);
    this.unitId = data.unit?.id ?? this.unitId;
    this.unitName = data.unit?.displayName ?? this.unitName;
  }
}

/** Bundle (care competency) with its selected activities */
@Exclude()
export class BundleSelectionRO {
  @Expose()
  bundleId!: string;

  @Expose()
  bundleName!: string;

  @Expose()
  selectedActivityIds!: string[];

  @Expose()
  totalActivityCount!: number;

  constructor(data: Partial<BundleSelectionRO>) {
    Object.assign(this, data);
  }
}

/** Permission entry showing activity-occupation permission level */
@Exclude()
export class TemplatePermissionRO {
  @Expose()
  activityId!: string;

  @Expose()
  occupationId!: string;

  @Expose()
  permission!: Permissions;

  constructor(data: Partial<TemplatePermissionRO>) {
    Object.assign(this, data);
  }
}

/** Detailed template with full bundle selections and permissions */
@Exclude()
export class CareSettingTemplateDetailRO extends CareSettingTemplateRO {
  @Expose()
  selectedBundles!: BundleSelectionRO[];

  @Expose()
  permissions!: TemplatePermissionRO[];

  constructor(data: any) {
    super(data);
    this.selectedBundles = data.selectedBundles ?? [];
    this.permissions = data.permissions ?? [];
  }
}
