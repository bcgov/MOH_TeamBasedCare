/**
 * Care Setting Template DTOs
 *
 * Data Transfer Objects for care setting template API operations.
 * Used by both frontend and backend for request validation.
 */
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
  Validate,
  ValidateIf,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Permissions } from '../constants/permissions';
import { TemplateLevel } from '../constants/templateLevel';

/** Maximum number of changes accepted in each incremental template-save collection. */
export const MAX_TEMPLATE_CHANGE_ITEMS = 5000;

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

/** Identifies a permission row that must be removed from a template. */
export class TemplatePermissionRemovalDTO {
  @IsUUID()
  activityId!: string;

  @IsUUID()
  occupationId!: string;
}

/** A changed permission row. N is represented by a removal, never an upsert. */
export class TemplatePermissionUpsertDTO extends TemplatePermissionDTO {
  @IsIn([Permissions.PERFORM, Permissions.LIMITS])
  override permission!: Permissions;
}

/** Incremental changes for one template save. Every array is required and may be empty. */
export class TemplateChangesDTO {
  @IsArray()
  @ArrayMaxSize(MAX_TEMPLATE_CHANGE_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => TemplatePermissionUpsertDTO)
  permissionUpserts!: TemplatePermissionUpsertDTO[];

  @IsArray()
  @ArrayMaxSize(MAX_TEMPLATE_CHANGE_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => TemplatePermissionRemovalDTO)
  permissionRemovals!: TemplatePermissionRemovalDTO[];

  @IsArray()
  @ArrayMaxSize(MAX_TEMPLATE_CHANGE_ITEMS)
  @IsUUID('all', { each: true })
  selectedBundleIdsToAdd!: string[];

  @IsArray()
  @ArrayMaxSize(MAX_TEMPLATE_CHANGE_ITEMS)
  @IsUUID('all', { each: true })
  selectedBundleIdsToRemove!: string[];

  @IsArray()
  @ArrayMaxSize(MAX_TEMPLATE_CHANGE_ITEMS)
  @IsUUID('all', { each: true })
  selectedActivityIdsToAdd!: string[];

  @IsArray()
  @ArrayMaxSize(MAX_TEMPLATE_CHANGE_ITEMS)
  @IsUUID('all', { each: true })
  selectedActivityIdsToRemove!: string[];
}

@ValidatorConstraint({ name: 'hasValidTemplateSaveMode' })
export class HasValidTemplateSaveMode implements ValidatorConstraintInterface {
  /**
   * Allows exactly one request shape: an incremental changes object or all legacy arrays.
   *
   * @param _value - Decorated marker-property value; validation uses the complete DTO instead.
   * @param args - Class-validator context containing the update DTO.
   * @returns `true` when the DTO supplies exactly one complete save mode.
   */
  validate(_value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as UpdateCareSettingTemplateDTO;
    const hasChanges = dto.changes !== undefined;
    const legacyValues = [dto.selectedBundleIds, dto.selectedActivityIds, dto.permissions];
    const hasLegacyValue = legacyValues.some(value => value !== undefined);
    const hasCompleteLegacyMode = legacyValues.every(value => value !== undefined);

    return hasChanges ? !hasLegacyValue : hasCompleteLegacyMode;
  }

  /**
   * Describes the accepted mutually exclusive save modes.
   *
   * @returns The validation message returned for mixed or incomplete modes.
   */
  defaultMessage(): string {
    return 'Provide either changes or all selected bundle, activity, and permission arrays.';
  }
}

@ValidatorConstraint({ name: 'hasNonOverlappingTemplateChanges' })
export class HasNonOverlappingTemplateChanges implements ValidatorConstraintInterface {
  /**
   * Rejects incomplete, duplicate, or conflicting incremental collections
   * before persistence can interpret an ambiguous change set.
   *
   * @param _value - Decorated marker-property value; validation uses the complete DTO instead.
   * @param args - Class-validator context containing the update DTO.
   * @returns `true` when every delta collection is valid, unique, and disjoint.
   */
  validate(_value: unknown, args: ValidationArguments): boolean {
    const changes = (args.object as UpdateCareSettingTemplateDTO).changes;
    if (!changes) return true;

    const {
      permissionUpserts,
      permissionRemovals,
      selectedBundleIdsToAdd,
      selectedBundleIdsToRemove,
      selectedActivityIdsToAdd,
      selectedActivityIdsToRemove,
    } = changes;
    const collections = [
      permissionUpserts,
      permissionRemovals,
      selectedBundleIdsToAdd,
      selectedBundleIdsToRemove,
      selectedActivityIdsToAdd,
      selectedActivityIdsToRemove,
    ];
    if (!collections.every(Array.isArray)) return false;

    const isDistinct = <T>(values: T[]) => new Set(values).size === values.length;
    const isDisjoint = (left: string[], right: string[]) =>
      isDistinct(left) && isDistinct(right) && !left.some(id => right.includes(id));
    const keyOf = (value: { activityId: string; occupationId: string }) =>
      `${value.activityId}::${value.occupationId}`;
    const upsertKeys = permissionUpserts.map(keyOf);
    const removalKeys = permissionRemovals.map(keyOf);

    return (
      isDisjoint(selectedBundleIdsToAdd, selectedBundleIdsToRemove) &&
      isDisjoint(selectedActivityIdsToAdd, selectedActivityIdsToRemove) &&
      isDistinct(upsertKeys) &&
      isDistinct(removalKeys) &&
      !upsertKeys.some(key => removalKeys.includes(key))
    );
  }

  /**
   * Describes the uniqueness and overlap requirements for incremental changes.
   *
   * @returns The validation message returned for incomplete or conflicting deltas.
   */
  defaultMessage(): string {
    return 'Template changes cannot contain duplicate or overlapping values.';
  }
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

  @ValidateIf(dto => dto.changes === undefined)
  @IsArray()
  @IsUUID('all', { each: true })
  selectedBundleIds?: string[];

  @ValidateIf(dto => dto.changes === undefined)
  @IsArray()
  @IsUUID('all', { each: true })
  selectedActivityIds?: string[];

  @ValidateIf(dto => dto.changes === undefined)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplatePermissionDTO)
  permissions?: TemplatePermissionDTO[];

  @IsOptional()
  @ValidateNested()
  @Type(() => TemplateChangesDTO)
  changes?: TemplateChangesDTO;

  /**
   * The version the client loaded. Optional so existing callers keep
   * validating; when omitted the save proceeds unguarded.
   */
  @IsInt()
  @Min(0)
  @IsOptional()
  expectedVersion?: number;

  @Validate(HasValidTemplateSaveMode)
  private readonly saveMode?: unknown;

  @Validate(HasNonOverlappingTemplateChanges)
  private readonly changesConsistency?: unknown;
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
