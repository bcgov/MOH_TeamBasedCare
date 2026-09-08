/**
 * Care Setting Template Response Objects
 *
 * RO classes for serializing care setting template data in API responses.
 * Uses class-transformer decorators for controlled field exposure.
 */
import { Exclude, Expose } from 'class-transformer';
import { BaseRO } from './base.ro';
import { Permissions } from '../constants/permissions';
import { TemplateLevel, getTemplateLevelLabel } from '../constants/templateLevel';

/** Basic template info for list views */
@Exclude()
export class CareSettingTemplateRO extends BaseRO {
  @Expose()
  isMaster!: boolean;

  @Expose()
  healthAuthority?: string;

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

  @Expose()
  level?: TemplateLevel | null;

  /** Derived, never stored. `Provincial` for masters. */
  @Expose()
  levelLabel!: string;

  /** Optimistic-concurrency token echoed back on save as `expectedVersion`. */
  @Expose()
  version!: number;

  @Expose()
  missingPermissionsCount?: number;

  constructor(data: any) {
    super(data);
    this.name = data.name ?? this.name;
    this.displayName = data.name ?? this.displayName;
    this.healthAuthority = data.healthAuthority;
    this.parentId = data.parent?.id ?? this.parentId;
    this.parentName = data.parent?.name ?? (data.isMaster ? 'Master' : this.parentName);
    this.unitId = data.unit?.id ?? this.unitId;
    this.unitName = data.unit?.displayName ?? this.unitName;
    this.level = data.level ?? null;
    this.levelLabel = getTemplateLevelLabel(data.isMaster, this.level);
    this.version = data.version ?? 0;
    this.missingPermissionsCount = data.missingPermissionsCount;
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

  @Expose()
  limitId?: string | null;

  /**
   * Inlined so the limits dialog pre-fills without a second request, and can
   * still name a limit that has since been deactivated.
   */
  @Expose()
  limitName?: string | null;

  @Expose()
  restrictionDescription?: string | null;

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
