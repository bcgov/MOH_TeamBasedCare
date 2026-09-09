/**
 * Care Setting Template Service
 *
 * Business logic for managing care setting templates. Templates define which
 * care competencies (bundles), activities, and occupation permissions are
 * available for a health authority unit.
 *
 * Key concepts:
 * - Master templates: Auto-created per unit, read-only, serve as defaults
 * - User templates: Copies of masters that can be customized
 * - Permissions: Define which occupations can perform which activities (Y/LC)
 */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { CareSettingTemplate } from './entity/care-setting-template.entity';
import { CareSettingTemplatePermission } from './entity/care-setting-template-permission.entity';
import { LimitCondition } from './entity/limit-condition.entity';
import { Unit } from './entity/unit.entity';
import { Bundle } from '../care-activity/entity/bundle.entity';
import { CareActivity } from '../care-activity/entity/care-activity.entity';
import { Occupation } from '../occupation/entity/occupation.entity';
import { AllowedActivity } from '../allowed-activity/entity/allowed-activity.entity';
import { FindCareSettingTemplatesDto } from './dto/find-care-setting-templates.dto';
import { UpdateCareSettingTemplateDetailsDto } from './dto/update-care-setting-template-details.dto';
import { TemplateVersionConflictException } from './template-version-conflict.exception';
import {
  CareSettingsCMSFindSortKeys,
  CareSettingTemplateRO,
  CareSettingTemplateDetailRO,
  BundleSelectionRO,
  TemplatePermissionRO,
  CreateCareSettingTemplateCopyDTO,
  CreateCareSettingTemplateCopyFullDTO,
  UpdateCareSettingTemplateDTO,
  SortOrder,
  BundleRO,
  OccupationRO,
  Permissions,
  MASTER_TEMPLATE_SUFFIX,
  LimitConditionRO,
  TemplateLevel,
  TemplateLevelFilter,
} from '@tbcm/common';
import _ from 'lodash';

@Injectable()
export class CareSettingTemplateService {
  constructor(
    @InjectRepository(CareSettingTemplate)
    private readonly templateRepo: Repository<CareSettingTemplate>,
    @InjectRepository(CareSettingTemplatePermission)
    private readonly permissionRepo: Repository<CareSettingTemplatePermission>,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
    @InjectRepository(Bundle)
    private readonly bundleRepo: Repository<Bundle>,
    @InjectRepository(CareActivity)
    private readonly careActivityRepo: Repository<CareActivity>,
    @InjectRepository(Occupation)
    private readonly occupationRepo: Repository<Occupation>,
    @InjectRepository(AllowedActivity)
    private readonly allowedActivityRepo: Repository<AllowedActivity>,
    @InjectRepository(LimitCondition)
    private readonly limitConditionRepo: Repository<LimitCondition>,
  ) {}

  /** Key for comparing a permission across templates. */
  private permissionKey(activityId: string, occupationId: string): string {
    return `${activityId}::${occupationId}`;
  }

  /**
   * Get basic template info for authorization checks
   * @throws NotFoundException if template doesn't exist
   */
  async getTemplateBasic(id: string): Promise<{ id: string; healthAuthority: string }> {
    const template = await this.templateRepo.findOne({
      where: { id },
      select: ['id', 'healthAuthority'],
    });

    if (!template) {
      throw new NotFoundException({ message: 'Care Setting Template not found' });
    }

    return template;
  }

  /**
   * Check if a template name already exists for a health authority.
   * Names must be unique within a health authority (regardless of unit).
   * @param name - The name to check
   * @param healthAuthority - The health authority to scope the check
   * @param excludeId - Optional template ID to exclude (for updates)
   * @throws BadRequestException if a duplicate name exists
   */
  private async checkDuplicateName(
    name: string,
    healthAuthority: string,
    excludeId?: string,
  ): Promise<void> {
    const queryBuilder = this.templateRepo
      .createQueryBuilder('t')
      .where('LOWER(t.name) = LOWER(:name)', { name: name.trim() });

    // GLOBAL templates are visible to all HAs, so check against every template.
    // HA-scoped templates only need to check their own HA + GLOBAL.
    if (healthAuthority !== 'GLOBAL') {
      queryBuilder.andWhere('t.healthAuthority IN (:...authorities)', {
        authorities: [healthAuthority, 'GLOBAL'],
      });
    }

    if (excludeId) {
      queryBuilder.andWhere('t.id != :excludeId', { excludeId });
    }

    const existing = await queryBuilder.getOne();
    if (existing) {
      throw new BadRequestException('A care setting with this name already exists.');
    }
  }

  /**
   * Find templates with pagination, search, and sorting
   * Filters by health authority - returns templates belonging to user's HA plus GLOBAL masters
   * @param query - Search/pagination options
   * @param healthAuthority - User's health authority to filter by
   * @returns Tuple of [templates, total count]
   */
  async findTemplates(
    query: FindCareSettingTemplatesDto,
    healthAuthority: string | null,
  ): Promise<[CareSettingTemplateRO[], number]> {
    const queryBuilder = this.templateRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.unit', 't_unit')
      .leftJoinAndSelect('t.parent', 't_parent');

    // Filter by health authority
    // null = admin, show all templates
    // string = user's HA, show HA + GLOBAL (or just GLOBAL if empty string)
    if (healthAuthority !== null) {
      if (healthAuthority) {
        queryBuilder.where(
          '(t.healthAuthority = :healthAuthority OR t.healthAuthority = :global)',
          {
            healthAuthority,
            global: 'GLOBAL',
          },
        );
      } else {
        // Users without org only see GLOBAL templates
        queryBuilder.where('t.healthAuthority = :global', { global: 'GLOBAL' });
      }
    }
    // If null (admin), no filter - show all templates

    // Search by name
    if (query.searchText) {
      queryBuilder.andWhere('t.name ILIKE :name', {
        name: `%${query.searchText}%`,
      });
    }

    // Filter by level. "Provincial" is not a stored value - it is the master
    // flag - so it is matched on isMaster rather than on the level column.
    // Composes with the search predicate above rather than replacing it.
    switch (query.level) {
      case TemplateLevelFilter.PROVINCIAL:
        queryBuilder.andWhere('t.isMaster = true');
        break;
      case TemplateLevelFilter.HEALTH_AUTHORITY:
        queryBuilder.andWhere('t.isMaster = false').andWhere('t.level = :level', {
          level: TemplateLevel.HEALTH_AUTHORITY,
        });
        break;
      case TemplateLevelFilter.SITE:
        queryBuilder.andWhere('t.isMaster = false').andWhere('t.level = :level', {
          level: TemplateLevel.SITE,
        });
        break;
      default:
        // ALL, or unspecified - no predicate
        break;
    }

    // Sort - always put masters first, then by requested sort
    const sortOrder = query.sortOrder || SortOrder.ASC;

    if (query.sortBy) {
      let orderBy = `t.${query.sortBy}`;

      if (query.sortBy === CareSettingsCMSFindSortKeys.PARENT_NAME) {
        orderBy = 't_parent.name';
      }

      if (query.sortBy === CareSettingsCMSFindSortKeys.LEVEL) {
        // Masters have no stored level; sort them as the provincial tier so the
        // column orders the way it reads: provincial, health authority, site.
        queryBuilder.addSelect(
          `CASE WHEN t.is_master THEN 0 WHEN t.level = '${TemplateLevel.HEALTH_AUTHORITY}' THEN 1 ELSE 2 END`,
          'level_rank',
        );
        orderBy = 'level_rank';
      }

      queryBuilder.orderBy('t.isMaster', 'DESC').addOrderBy(orderBy, sortOrder as SortOrder);
    } else {
      // Default: masters first, then newest first
      queryBuilder.orderBy('t.isMaster', 'DESC').addOrderBy('t.createdAt', 'DESC');
    }

    // Pagination
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;

    const [results, count] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    // Batch load missing permissions counts for the returned templates
    const templateIds = results.map(t => t.id);
    const missingCounts = await this.getMissingPermissionsCountBatch(templateIds);

    return [
      results.map(t => {
        const ro = new CareSettingTemplateRO(t);
        ro.missingPermissionsCount = missingCounts.get(t.id) ?? 0;
        return ro;
      }),
      count,
    ];
  }

  /**
   * Batch count activities missing Y/LC permissions for multiple templates.
   * An activity is "missing permissions" if it's selected in the template but has
   * NO rows in care_setting_template_permission with Y or LC for ANY occupation.
   * @param templateIds - Template IDs to count for
   * @returns Map of templateId -> missing count (templates not in map have 0)
   */
  private async getMissingPermissionsCountBatch(
    templateIds: string[],
  ): Promise<Map<string, number>> {
    if (templateIds.length === 0) return new Map();

    const results = await this.templateRepo.manager
      .createQueryBuilder()
      .select('csta.care_setting_template_id', 'template_id')
      .addSelect('COUNT(*)', 'missing_count')
      .from('care_setting_template_activities', 'csta')
      .leftJoin(
        'care_setting_template_permission',
        'cstp',
        "cstp.template_id = csta.care_setting_template_id AND cstp.care_activity_id = csta.care_activity_id AND cstp.permission IN ('Y', 'LC')",
      )
      .where('csta.care_setting_template_id IN (:...templateIds)', { templateIds })
      .andWhere('cstp.id IS NULL')
      .groupBy('csta.care_setting_template_id')
      .getRawMany();

    return new Map(results.map(r => [r.template_id, Number(r.missing_count)]));
  }

  /**
   * Get detailed template including all selected bundles, activities, and permissions
   * @throws NotFoundException if template doesn't exist
   */
  async getTemplateById(id: string): Promise<CareSettingTemplateDetailRO> {
    const template = await this.templateRepo.findOne({
      where: { id },
      relations: [
        'unit',
        'parent',
        'selectedBundles',
        'selectedActivities',
        // Note: permissions loaded via raw query below to avoid loading full entities
      ],
    });

    if (!template) {
      throw new NotFoundException({ message: 'Care Setting Template not found' });
    }

    // Build bundle selections with activity counts
    const selectedBundles = await this.buildBundleSelections(template);

    // Load permissions as flat data (no entity relations) - major performance improvement
    // Use snake_case column names for raw query
    // The limit is joined in rather than fetched later so a single load gives
    // the wizard everything it needs; the limits dialog then opens pre-filled
    // without a request of its own, and a limit that has since been
    // deactivated still resolves by name.
    const rawPermissions = await this.permissionRepo
      .createQueryBuilder('p')
      .leftJoin(LimitCondition, 'lc', 'lc.id = p.limit_condition_id')
      .select('p.care_activity_id', 'care_activity_id')
      .addSelect('p.occupation_id', 'occupation_id')
      .addSelect('p.permission', 'permission')
      .addSelect('p.limit_condition_id', 'limit_condition_id')
      .addSelect('p.restriction_description', 'restriction_description')
      .addSelect('lc.name', 'limit_name')
      .where('p.template_id = :templateId', { templateId: id })
      .getRawMany();

    const permissions = rawPermissions.map(
      p =>
        new TemplatePermissionRO({
          activityId: p.care_activity_id,
          occupationId: p.occupation_id,
          permission: p.permission,
          limitId: p.limit_condition_id ?? null,
          limitName: p.limit_name ?? null,
          restrictionDescription: p.restriction_description ?? null,
        }),
    );

    // Note: We do NOT load parent permissions here.
    // Permission inheritance happens only at copy time (copyTemplate).
    // Once a template is saved, it is self-contained. This prevents
    // silently restoring permissions an admin explicitly removed (set to N).

    const detail = new CareSettingTemplateDetailRO(template);
    detail.selectedBundles = selectedBundles;
    detail.permissions = permissions;

    return detail;
  }

  /**
   * Lightweight template fetch for copy wizard - returns IDs only
   * Avoids loading full permission entities which can timeout on master templates
   */
  async getTemplateForCopy(id: string): Promise<{
    id: string;
    name: string;
    unitId: string;
    selectedBundleIds: string[];
    selectedActivityIds: string[];
    permissions: {
      activityId: string;
      occupationId: string;
      permission: string;
      limitId: string | null;
      restrictionDescription: string | null;
    }[];
  }> {
    const template = await this.templateRepo.findOne({
      where: { id },
      relations: ['unit', 'selectedBundles', 'selectedActivities'],
    });

    if (!template) {
      throw new NotFoundException({ message: 'Care Setting Template not found' });
    }

    // Load permissions as flat data (no entity relations)
    // Use snake_case column names for raw query
    const permissions = await this.permissionRepo
      .createQueryBuilder('p')
      .select('p.care_activity_id', 'care_activity_id')
      .addSelect('p.occupation_id', 'occupation_id')
      .addSelect('p.permission', 'permission')
      .addSelect('p.limit_condition_id', 'limit_condition_id')
      .addSelect('p.restriction_description', 'restriction_description')
      .where('p.template_id = :templateId', { templateId: id })
      .getRawMany();

    const copied = new Map<
      string,
      {
        activityId: string;
        occupationId: string;
        permission: string;
        limitId: string | null;
        restrictionDescription: string | null;
      }
    >();

    // A master is read-only, so it has no deliberately removed cells: any pair
    // it is missing is a gap left by an earlier sync, not an admin decision.
    // The occupation scope is therefore laid down first as the baseline, and
    // the template's own rows are applied over it below.
    if (template.isMaster) {
      for (const scoped of await this.getUnitScopePermissions(template)) {
        copied.set(this.permissionKey(scoped.activityId, scoped.occupationId), scoped);
      }
    }

    for (const p of permissions) {
      copied.set(this.permissionKey(p.care_activity_id, p.occupation_id), {
        activityId: p.care_activity_id,
        occupationId: p.occupation_id,
        permission: p.permission,
        limitId: p.limit_condition_id ?? null,
        restrictionDescription: p.restriction_description ?? null,
      });
    }

    return {
      id: template.id,
      name: template.name,
      unitId: template.unit.id,
      selectedBundleIds: template.selectedBundles.map(b => b.id),
      selectedActivityIds: template.selectedActivities.map(a => a.id),
      permissions: Array.from(copied.values()),
    };
  }

  /**
   * The occupation scope recorded against a master template's activities, used
   * as the baseline a copy of that master inherits.
   *
   * Rows carrying no unit are included: the CMS records an occupation's scope
   * without one, and syncOccupationToAllTemplates likewise matches on activity
   * alone, so excluding them would drop every permission added that way.
   */
  private async getUnitScopePermissions(template: CareSettingTemplate): Promise<
    {
      activityId: string;
      occupationId: string;
      permission: string;
      limitId: null;
      restrictionDescription: null;
    }[]
  > {
    const activityIds = template.selectedActivities.map(activity => activity.id);

    if (activityIds.length === 0) return [];

    const rows = await this.allowedActivityRepo
      .createQueryBuilder('aa')
      .select('aa.care_activity_id', 'care_activity_id')
      .addSelect('aa.occupation_id', 'occupation_id')
      .addSelect('aa.permission', 'permission')
      .where('aa.care_activity_id IN (:...activityIds)', { activityIds })
      .andWhere('(aa.unit_id = :unitId OR aa.unit_id IS NULL)', { unitId: template.unit.id })
      // The column's enum only holds Y and LC, so there is no N to filter out:
      // absence of a row is what records N here.
      .getRawMany();

    return rows.map(r => ({
      activityId: r.care_activity_id,
      occupationId: r.occupation_id,
      permission: r.permission,
      limitId: null,
      restrictionDescription: null,
    }));
  }

  /**
   * Build bundle selection data showing which activities are selected per bundle
   */
  private async buildBundleSelections(template: CareSettingTemplate): Promise<BundleSelectionRO[]> {
    // Get all bundles with their activities for the unit
    const bundles = await this.bundleRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.careActivities', 'b_ca')
      .innerJoin('b_ca.careLocations', 'b_ca_cl', 'b_ca_cl.id = :unitId', {
        unitId: template.unit.id,
      })
      .orderBy('b.displayName', 'ASC')
      .getMany();

    const selectedBundleIds = new Set(template.selectedBundles.map(b => b.id));
    const selectedActivityIds = new Set(template.selectedActivities.map(a => a.id));

    return bundles
      .filter(b => selectedBundleIds.has(b.id))
      .map(
        b =>
          new BundleSelectionRO({
            bundleId: b.id,
            bundleName: b.displayName,
            selectedActivityIds: b.careActivities
              .filter(a => selectedActivityIds.has(a.id))
              .map(a => a.id),
            totalActivityCount: b.careActivities.length,
          }),
      );
  }

  /**
   * Get all bundles (care competencies) available for a template's unit
   * Includes all care activities within each bundle
   */
  async getBundlesForTemplate(templateId: string): Promise<BundleRO[]> {
    const template = await this.templateRepo.findOne({
      where: { id: templateId },
      relations: ['unit'],
    });

    if (!template) {
      throw new NotFoundException({ message: 'Care Setting Template not found' });
    }

    // Get all bundles with activities for this unit
    const bundles = await this.bundleRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.careActivities', 'b_ca')
      .innerJoin('b_ca.careLocations', 'b_ca_cl', 'b_ca_cl.id = :unitId', {
        unitId: template.unit.id,
      })
      .orderBy('b.displayName', 'ASC')
      .addOrderBy('b_ca.displayName', 'ASC')
      .getMany();

    return bundles.map(b => new BundleRO(b));
  }

  /**
   * Get all occupations available for permission assignment
   * Occupations are global (not unit-specific)
   */
  async getOccupationsForTemplate(templateId: string): Promise<OccupationRO[]> {
    // Verify template exists
    const template = await this.templateRepo.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException({ message: 'Care Setting Template not found' });
    }

    // Get all occupations (they're shared across all care settings)
    const occupations = await this.occupationRepo.find({
      order: { displayName: 'ASC' },
    });

    return occupations.map(o => new OccupationRO(o));
  }

  private resolveCopyLevel(
    source: CareSettingTemplate,
    requested?: TemplateLevel | null,
  ): TemplateLevel {
    if (requested) return requested;

    // A copy of a master belongs to a health authority; anything copied further
    // down the chain is a site template.
    return source.isMaster ? TemplateLevel.HEALTH_AUTHORITY : TemplateLevel.SITE;
  }

  /**
   * Validate the limits attached to submitted permissions and return them in a
   * form the permission rows can be written from.
   *
   * `legacyLcPairs` names the (activity, occupation) pairs already stored as LC
   * with no limit. Those predate this feature and cannot be backfilled, so a
   * resubmission of one unchanged is accepted; without this exemption a
   * template containing a single untouched legacy cell could never be saved
   * again, because every save resubmits every permission.
   */
  private async resolvePermissionLimits(
    permissions: {
      activityId: string;
      occupationId: string;
      permission: Permissions;
      limitId?: string | null;
      restrictionDescription?: string | null;
    }[],
    legacyLcPairs: Set<string>,
  ): Promise<Map<string, { limit: LimitCondition | null; restrictionDescription: string | null }>> {
    const resolved = new Map<
      string,
      { limit: LimitCondition | null; restrictionDescription: string | null }
    >();

    const requestedLimitIds = Array.from(
      new Set(
        permissions
          .filter(p => p.permission === Permissions.LIMITS && p.limitId)
          .map(p => p.limitId as string),
      ),
    );

    const limits = requestedLimitIds.length
      ? await this.limitConditionRepo.find({ where: { id: In(requestedLimitIds) } })
      : [];
    const limitMap = new Map(limits.map(l => [l.id, l]));

    for (const p of permissions) {
      const key = this.permissionKey(p.activityId, p.occupationId);

      // Anything that is not LC carries no limit, whatever the client sent.
      if (p.permission !== Permissions.LIMITS) {
        resolved.set(key, { limit: null, restrictionDescription: null });
        continue;
      }

      if (!p.limitId) {
        if (!legacyLcPairs.has(key)) {
          throw new BadRequestException(
            'A limit must be selected for every permission set to limits and conditions.',
          );
        }

        // Untouched legacy cell - preserve it exactly as it was.
        resolved.set(key, { limit: null, restrictionDescription: null });
        continue;
      }

      const limit = limitMap.get(p.limitId);
      if (!limit) {
        throw new BadRequestException('The selected limit is not a valid option.');
      }

      const description = p.restrictionDescription?.trim() || null;
      if (description && description.length > 2000) {
        throw new BadRequestException('Restriction description cannot exceed 2000 characters.');
      }

      resolved.set(key, { limit, restrictionDescription: description });
    }

    return resolved;
  }

  /**
   * Read the (activity, occupation) pairs currently stored as LC with no limit.
   */
  private async getLegacyLcPairs(templateId: string): Promise<Set<string>> {
    const rows = await this.permissionRepo
      .createQueryBuilder('p')
      .select('p.care_activity_id', 'care_activity_id')
      .addSelect('p.occupation_id', 'occupation_id')
      .where('p.template_id = :templateId', { templateId })
      .andWhere('p.permission = :lc', { lc: Permissions.LIMITS })
      .andWhere('p.limit_condition_id IS NULL')
      .getRawMany();

    return new Set(rows.map(r => this.permissionKey(r.care_activity_id, r.occupation_id)));
  }

  /** The catalogue of limits offered in the dialog. */
  async getLimitConditions(): Promise<LimitConditionRO[]> {
    const limits = await this.limitConditionRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    return limits.map(l => new LimitConditionRO(l));
  }

  /**
   * The direct parent's permissions, used as the baseline for the
   * "Changes made by HA" badge. Limits are deliberately omitted: the badge
   * compares permission levels only.
   *
   * Returns an empty array when the template has no parent, so a master or an
   * orphan simply shows no badges.
   */
  async getParentPermissions(
    id: string,
  ): Promise<{ activityId: string; occupationId: string; permission: Permissions }[]> {
    const template = await this.templateRepo.findOne({
      where: { id },
      relations: ['parent'],
    });

    if (!template) {
      throw new NotFoundException({ message: 'Care Setting Template not found' });
    }

    if (!template.parent) return [];

    const rows = await this.permissionRepo
      .createQueryBuilder('p')
      .select('p.care_activity_id', 'care_activity_id')
      .addSelect('p.occupation_id', 'occupation_id')
      .addSelect('p.permission', 'permission')
      .where('p.template_id = :templateId', { templateId: template.parent.id })
      .getRawMany();

    return rows.map(r => ({
      activityId: r.care_activity_id,
      occupationId: r.occupation_id,
      permission: r.permission,
    }));
  }

  /**
   * Create a copy of an existing template
   * Copies all selected bundles, activities, and permissions
   * The new template is always non-master and references the source as parent
   * @param sourceId - ID of template to copy
   * @param dto - Copy configuration (name)
   * @param healthAuthority - Health authority for the new template (from user's organization)
   * @deprecated Use copyTemplateWithData instead
   */
  async copyTemplate(
    sourceId: string,
    dto: CreateCareSettingTemplateCopyDTO,
    healthAuthority: string,
  ): Promise<CareSettingTemplateRO> {
    const source = await this.templateRepo.findOne({
      where: { id: sourceId },
      relations: [
        'unit',
        'selectedBundles',
        'selectedActivities',
        'permissions',
        'permissions.careActivity',
        'permissions.occupation',
        'permissions.limitCondition',
      ],
    });

    if (!source) {
      throw new NotFoundException({ message: 'Source template not found' });
    }

    // Check for duplicate name before creating copy (scoped to HA)
    await this.checkDuplicateName(dto.name, healthAuthority);

    // Create new template (createdBy/updatedBy auto-set by AuditSubscriber)
    const newTemplate = this.templateRepo.create({
      name: dto.name,
      isMaster: false,
      healthAuthority,
      level: this.resolveCopyLevel(source, dto.level),
      unit: source.unit,
      parent: source,
      selectedBundles: source.selectedBundles,
      selectedActivities: source.selectedActivities,
    });

    const saved = await this.templateRepo.save(newTemplate);

    // Copy permissions
    const newPermissions = source.permissions.map(p =>
      this.permissionRepo.create({
        template: saved,
        careActivity: p.careActivity,
        occupation: p.occupation,
        permission: p.permission,
        // Inherited along with the permission, so a copy of an LC cell arrives
        // already valid rather than needing the limit re-picked.
        limitCondition: p.limitCondition ?? null,
        restrictionDescription: p.restrictionDescription ?? null,
      }),
    );

    if (newPermissions.length > 0) {
      await this.permissionRepo.save(newPermissions);
    }

    // Reload with relations
    const result = await this.templateRepo.findOne({
      where: { id: saved.id },
      relations: ['unit', 'parent'],
    });

    return new CareSettingTemplateRO(result);
  }

  /**
   * Create a copy of an existing template with full customization data
   * Unlike copyTemplate, this allows specifying custom bundles, activities, and permissions
   * instead of copying them from the source template.
   *
   * Use this for deferred copy creation where user customizes before saving.
   * @param sourceId - ID of template to copy
   * @param dto - Full customization data (name, bundles, activities, permissions)
   * @param healthAuthority - Health authority for the new template (from user's organization)
   */
  async copyTemplateWithData(
    sourceId: string,
    dto: CreateCareSettingTemplateCopyFullDTO,
    healthAuthority: string,
  ): Promise<CareSettingTemplateRO> {
    const source = await this.templateRepo.findOne({
      where: { id: sourceId },
      relations: ['unit'],
    });

    if (!source) {
      throw new NotFoundException({ message: 'Source template not found' });
    }

    // Check for duplicate name (scoped to HA)
    await this.checkDuplicateName(dto.name, healthAuthority);

    // Get selected bundles
    const selectedBundles = await this.bundleRepo.find({
      where: { id: In(dto.selectedBundleIds) },
    });

    // Get selected activities
    const selectedActivities = await this.careActivityRepo.find({
      where: { id: In(dto.selectedActivityIds) },
    });

    // Resolve every permission before anything is written, so an invalid
    // payload is rejected before the template row exists. The exemption is
    // taken from the SOURCE: the wizard resubmits inherited permissions
    // verbatim, and an LC cell inherited from a template that predates limits
    // carries none. Rejecting those would make such a template uncopyable,
    // because an untouched cell shows no badge and cannot be opened in the
    // limits dialog. A newly chosen LC is not in the set and still needs one.
    const permissionInputs = dto.permissions ?? [];
    const legacyLcPairs = await this.getLegacyLcPairs(sourceId);
    const resolvedLimits = await this.resolvePermissionLimits(permissionInputs, legacyLcPairs);

    const activities = permissionInputs.length
      ? await this.careActivityRepo.find({
          where: { id: In(permissionInputs.map(p => p.activityId)) },
        })
      : [];
    const activityMap = new Map(activities.map(a => [a.id, a]));

    const occupations = permissionInputs.length
      ? await this.occupationRepo.find({
          where: { id: In(permissionInputs.map(p => p.occupationId)) },
        })
      : [];
    const occupationMap = new Map(occupations.map(o => [o.id, o]));

    // Create new template with provided data
    const newTemplate = this.templateRepo.create({
      name: dto.name,
      isMaster: false,
      healthAuthority,
      level: this.resolveCopyLevel(source, dto.level),
      unit: source.unit,
      parent: source,
      selectedBundles,
      selectedActivities,
    });

    // Template and permissions go in together: a failure part-way through must
    // not leave an orphan template whose name then blocks the retry.
    const saved = await this.templateRepo.manager.transaction(async manager => {
      const persisted = await manager.save(CareSettingTemplate, newTemplate);

      const newPermissions = permissionInputs
        .filter(p => activityMap.has(p.activityId) && occupationMap.has(p.occupationId))
        .map(p => {
          const resolved = resolvedLimits.get(this.permissionKey(p.activityId, p.occupationId));

          return manager.create(CareSettingTemplatePermission, {
            template: persisted,
            careActivity: activityMap.get(p.activityId)!,
            occupation: occupationMap.get(p.occupationId)!,
            permission: p.permission,
            limitCondition: resolved?.limit ?? null,
            restrictionDescription: resolved?.restrictionDescription ?? null,
          });
        });

      if (newPermissions.length > 0) {
        await manager.save(CareSettingTemplatePermission, newPermissions);
      }

      return persisted;
    });

    // Reload with relations
    const result = await this.templateRepo.findOne({
      where: { id: saved.id },
      relations: ['unit', 'parent'],
    });

    return new CareSettingTemplateRO(result);
  }

  /**
   * Update a template's name, selected bundles/activities, and permissions
   * @throws BadRequestException if attempting to edit a master template
   * @throws ForbiddenException if user's HA doesn't match template's HA
   * @throws NotFoundException if template doesn't exist
   *
   * Note: Permissions are replaced entirely (delete all, then recreate)
   */
  async updateTemplate(
    id: string,
    dto: UpdateCareSettingTemplateDTO,
    healthAuthority?: string,
  ): Promise<void> {
    const template = await this.templateRepo.findOne({
      where: { id },
      relations: ['unit'],
    });

    if (!template) {
      throw new NotFoundException({ message: 'Care Setting Template not found' });
    }

    if (template.isMaster) {
      throw new BadRequestException('Cannot edit master templates. Create a copy instead.');
    }

    // Validate user has access to this template's health authority
    if (healthAuthority && template.healthAuthority !== healthAuthority) {
      throw new ForbiddenException('Cannot modify templates belonging to another health authority');
    }

    // Update name if provided, checking for duplicates (scoped to same HA)
    if (dto.name && dto.name !== template.name) {
      await this.checkDuplicateName(dto.name, template.healthAuthority, id);
      template.name = dto.name;
    }

    // Resolve limits before touching anything, so an invalid payload is
    // rejected while the stored permissions are still intact.
    const legacyLcPairs = await this.getLegacyLcPairs(id);
    const resolvedLimits = await this.resolvePermissionLimits(dto.permissions ?? [], legacyLcPairs);

    const selectedBundles = await this.bundleRepo.find({
      where: { id: In(dto.selectedBundleIds) },
    });

    const selectedActivities = await this.careActivityRepo.find({
      where: { id: In(dto.selectedActivityIds) },
    });

    const activities = dto.permissions?.length
      ? await this.careActivityRepo.find({
          where: { id: In(dto.permissions.map(p => p.activityId)) },
        })
      : [];
    const activityMap = new Map(activities.map(a => [a.id, a]));

    const occupations = dto.permissions?.length
      ? await this.occupationRepo.find({
          where: { id: In(dto.permissions.map(p => p.occupationId)) },
        })
      : [];
    const occupationMap = new Map(occupations.map(o => [o.id, o]));

    // One transaction for the whole save. Two things depend on this: the
    // version guard has to hold until the new permissions are written, and the
    // delete-then-recreate must not be able to leave the template with no
    // permissions if a later step fails.
    await this.templateRepo.manager.transaction(async manager => {
      const claimedVersion = await this.guardVersion(manager, id, dto.expectedVersion);

      template.selectedBundles = selectedBundles;
      template.selectedActivities = selectedActivities;
      // Carry the claimed token onto the entity, or the save below would
      // restore the pre-guard version and let a second editor claim it again.
      template.version = claimedVersion;

      // updatedBy auto-set by AuditSubscriber
      await manager.save(CareSettingTemplate, template);

      // Permissions are replaced wholesale, which is also how a limit removed
      // from a cell disappears - no separate cleanup step is needed.
      await manager.delete(CareSettingTemplatePermission, { template: { id } });

      if (dto.permissions && dto.permissions.length > 0) {
        const newPermissions = dto.permissions
          .filter(p => activityMap.has(p.activityId) && occupationMap.has(p.occupationId))
          .map(p => {
            const resolved = resolvedLimits.get(this.permissionKey(p.activityId, p.occupationId));

            return manager.create(CareSettingTemplatePermission, {
              template,
              careActivity: activityMap.get(p.activityId)!,
              occupation: occupationMap.get(p.occupationId)!,
              permission: p.permission,
              limitCondition: resolved?.limit ?? null,
              restrictionDescription: resolved?.restrictionDescription ?? null,
            });
          });

        if (newPermissions.length > 0) {
          await manager.save(CareSettingTemplatePermission, newPermissions);
        }
      }
    });
  }

  /**
   * Claim the right to write this template by advancing its version.
   *
   * Deliberately an explicit guarded UPDATE rather than TypeORM's @VersionColumn:
   * a permission-only edit changes no scalar column on the template, so an
   * entity save may issue no UPDATE at all and neither `version` nor
   * `updatedAt` would move - leaving two concurrent editors both believing
   * they were first.
   *
   * Must run before any destructive step, so a rejected save writes nothing.
   *
   * Returns the version just claimed. Callers must copy it onto the entity they
   * are about to save, otherwise TypeORM writes the stale in-memory `version`
   * back over the incremented one and the next editor's token still matches.
   */
  private async guardVersion(
    manager: EntityManager,
    id: string,
    expectedVersion?: number,
  ): Promise<number> {
    if (expectedVersion === undefined || expectedVersion === null) {
      // No token supplied - preserve existing behaviour for callers that
      // predate optimistic locking. The web client always sends one.
      const unguarded = await manager.query(
        `UPDATE care_setting_template SET version = version + 1 WHERE id = $1 RETURNING version`,
        [id],
      );

      const claimed = this.readClaimedVersion(unguarded);

      if (claimed === undefined) {
        throw new NotFoundException({ message: 'Care Setting Template not found' });
      }

      return claimed;
    }

    const result = await manager.query(
      `UPDATE care_setting_template SET version = version + 1 WHERE id = $1 AND version = $2 RETURNING version`,
      [id, expectedVersion],
    );

    const claimed = this.readClaimedVersion(result);

    if (claimed === undefined) {
      const current = await manager.findOne(CareSettingTemplate, {
        where: { id },
        relations: ['updatedBy'],
      });

      if (!current) {
        throw new NotFoundException({ message: 'Care Setting Template not found' });
      }

      throw new TemplateVersionConflictException({
        currentVersion: current.version,
        updatedBy: current.updatedBy?.displayName || current.updatedBy?.email || undefined,
        updatedAt: current.updatedAt,
      });
    }

    return claimed;
  }

  /**
   * Pull the claimed version out of a guarded `UPDATE ... RETURNING version`.
   *
   * The postgres driver hands back `[rows, affectedCount]` for an UPDATE, but
   * a structured QueryResult is returned when raw results are disabled, so both
   * shapes are handled. `undefined` means no row matched the guard.
   */
  private readClaimedVersion(result: unknown): number | undefined {
    const rows = Array.isArray(result)
      ? Array.isArray(result[0])
        ? result[0]
        : result
      : Array.isArray((result as { rows?: unknown[] } | undefined)?.rows)
        ? (result as { rows: unknown[] }).rows
        : Array.isArray((result as { records?: unknown[] } | undefined)?.records)
          ? (result as { records: unknown[] }).records
          : typeof result === 'object' && result !== null && 'version' in result
            ? [result]
            : [];

    if (!Array.isArray(rows) || rows.length === 0) {
      return undefined;
    }

    const row = rows[0] as { version?: unknown } | undefined;
    const version = Number(row?.version);

    return Number.isFinite(version) ? version : undefined;
  }

  /**
   * Update only a template's name and level, from the details dialog.
   *
   * Changing the level never reads or writes the parent link: a template that
   * is reclassified keeps its ancestry and its inherited permissions.
   */
  async updateTemplateDetails(
    id: string,
    dto: UpdateCareSettingTemplateDetailsDto,
    healthAuthority?: string,
  ): Promise<CareSettingTemplateRO> {
    const template = await this.templateRepo.findOne({
      where: { id },
      relations: ['unit', 'parent'],
    });

    if (!template) {
      throw new NotFoundException({ message: 'Care Setting Template not found' });
    }

    if (template.isMaster) {
      throw new BadRequestException('Cannot edit master templates. Create a copy instead.');
    }

    if (healthAuthority && template.healthAuthority !== healthAuthority) {
      throw new ForbiddenException('Cannot modify templates belonging to another health authority');
    }

    const name = dto.name?.trim();
    if (!name) {
      throw new BadRequestException('Name is required');
    }

    if (name.toLowerCase() !== template.name.toLowerCase()) {
      await this.checkDuplicateName(name, template.healthAuthority, id);
    }

    await this.templateRepo.manager.transaction(async manager => {
      const claimedVersion = await this.guardVersion(manager, id, dto.expectedVersion);

      template.name = name;
      template.level = dto.level;
      // Same reason as updateTemplate: the stale in-memory version must not be
      // written back over the token this transaction just claimed.
      template.version = claimedVersion;

      await manager.save(CareSettingTemplate, template);
    });

    const updated = await this.templateRepo.findOne({
      where: { id },
      relations: ['unit', 'parent'],
    });

    return new CareSettingTemplateRO(updated);
  }

  /**
   * Load template with unit and selectedActivities for planning session creation
   * @throws NotFoundException if template doesn't exist
   */
  async getTemplateForPlanning(id: string): Promise<CareSettingTemplate> {
    const template = await this.templateRepo.findOne({
      where: { id },
      relations: ['unit', 'selectedActivities'],
    });
    if (!template) {
      throw new NotFoundException('Care Setting Template not found');
    }
    return template;
  }

  /**
   * Get raw permission data for activity gap calculation
   * Returns rows matching the shape expected by getPlanningActivityGap
   */
  async getPermissionsForGap(
    templateId: string,
    careActivityIds: string[],
    occupationIds: string[],
  ): Promise<{ permission: string; care_activity_id: string; occupation_id: string }[]> {
    if (careActivityIds.length === 0 || occupationIds.length === 0) {
      return [];
    }
    return this.permissionRepo
      .createQueryBuilder('cstp')
      .select('cstp.permission', 'permission')
      .addSelect('cstp.careActivity', 'care_activity_id')
      .addSelect('cstp.occupation', 'occupation_id')
      .where('cstp.template = :templateId', { templateId })
      .andWhere('cstp.careActivity IN (:...activityIds)', { activityIds: careActivityIds })
      .andWhere('cstp.occupation IN (:...occupationIds)', { occupationIds: occupationIds })
      .getRawMany();
  }

  /**
   * Get flat list of templates for planning dropdown
   * Returns templates for the user's health authority plus GLOBAL masters
   * @param healthAuthority - User's HA, or null to return ALL templates (for admins)
   */
  async findAllForPlanning(healthAuthority: string | null): Promise<CareSettingTemplateRO[]> {
    const queryBuilder = this.templateRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.unit', 't_unit')
      .leftJoinAndSelect('t.parent', 't_parent');

    // Admin (null) sees all templates, HA users see their HA + GLOBAL
    if (healthAuthority !== null) {
      if (healthAuthority) {
        queryBuilder.where('(t.healthAuthority = :ha OR t.healthAuthority = :global)', {
          ha: healthAuthority,
          global: 'GLOBAL',
        });
      } else {
        // Users without org only see GLOBAL templates
        queryBuilder.where('t.healthAuthority = :global', { global: 'GLOBAL' });
      }
    }

    const templates = await queryBuilder.orderBy('t.name', 'ASC').getMany();
    return templates.map(t => new CareSettingTemplateRO(t));
  }

  /**
   * Get all templates for CMS filter dropdown (no pagination)
   * Applies same HA filtering and sorting as findTemplates but without skip/take overhead
   * @param healthAuthority - User's HA, or null to return ALL templates (for admins)
   */
  async findAllForCMSFilter(healthAuthority: string | null): Promise<CareSettingTemplateRO[]> {
    const queryBuilder = this.templateRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.unit', 't_unit')
      .leftJoinAndSelect('t.parent', 't_parent');

    if (healthAuthority !== null) {
      if (healthAuthority) {
        queryBuilder.where(
          '(t.healthAuthority = :healthAuthority OR t.healthAuthority = :global)',
          { healthAuthority, global: 'GLOBAL' },
        );
      } else {
        // Users without org only see GLOBAL templates
        queryBuilder.where('t.healthAuthority = :global', { global: 'GLOBAL' });
      }
    }

    queryBuilder.orderBy('t.isMaster', 'DESC').addOrderBy('t.name', 'ASC');

    const results = await queryBuilder.getMany();
    return results.map(t => new CareSettingTemplateRO(t));
  }

  /**
   * Delete a template and all associated permissions
   * @throws BadRequestException if attempting to delete a master template
   * @throws BadRequestException if template is referenced by draft planning sessions
   * @throws ForbiddenException if user's HA doesn't match template's HA
   * @throws NotFoundException if template doesn't exist
   */
  async deleteTemplate(id: string, healthAuthority?: string): Promise<void> {
    const template = await this.templateRepo.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException({ message: 'Care Setting Template not found' });
    }

    if (template.isMaster) {
      throw new BadRequestException('Cannot delete master templates.');
    }

    // Validate user has access to this template's health authority
    if (healthAuthority && template.healthAuthority !== healthAuthority) {
      throw new ForbiddenException('Cannot delete templates belonging to another health authority');
    }

    // Check if any planning session references this template (raw query to avoid module coupling).
    // All sessions count, draft and published — deleting the template would otherwise orphan them.
    const result = await this.templateRepo.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('planning_session', 'ps')
      .where('ps.care_setting_template_id = :id', { id })
      .getRawOne();

    if (parseInt(result.count) > 0) {
      throw new BadRequestException(
        `Cannot delete template: it is referenced by ${result.count} care plan(s).`,
      );
    }

    // Delete permissions first (cascade should handle this, but being explicit)
    await this.permissionRepo.delete({ template: { id } });

    // Delete the template
    await this.templateRepo.delete({ id });
  }

  /**
   * Get all permissions for suggestion engine
   * Returns permissions for ALL occupations (not just selected ones) with occupation names
   * Used to calculate suggestion scores for occupations not yet in the session
   */
  async getPermissionsForSuggestions(
    templateId: string,
    careActivityIds: string[],
  ): Promise<
    {
      permission: string;
      care_activity_id: string;
      occupation_id: string;
      occupation_name: string;
    }[]
  > {
    if (careActivityIds.length === 0) {
      return [];
    }
    return this.permissionRepo
      .createQueryBuilder('cstp')
      .select('cstp.permission', 'permission')
      .addSelect('cstp.careActivity', 'care_activity_id')
      .addSelect('cstp.occupation', 'occupation_id')
      .innerJoin('cstp.occupation', 'o')
      .addSelect('o.displayName', 'occupation_name')
      .where('cstp.template = :templateId', { templateId })
      .andWhere('cstp.careActivity IN (:...activityIds)', { activityIds: careActivityIds })
      .andWhere('cstp.permission IN (:...perms)', { perms: ['Y', 'LC'] })
      .getRawMany();
  }

  /**
   * Sync occupation permissions to ALL templates.
   * Called when CMS creates or updates occupation scope permissions.
   *
   * Templates define which activities are needed for a care setting.
   * Occupations define what roles can do (permissions).
   * When occupation capabilities change, all templates should reflect this.
   *
   * @param occupationId - The occupation whose permissions changed
   * @param permissions - New permissions array from CMS (careActivityId + permission)
   */
  async syncOccupationToAllTemplates(
    occupationId: string,
    permissions: { careActivityId: string; permission: string }[],
  ): Promise<void> {
    // 1. Delete ALL existing permissions for this occupation across ALL templates
    // This is efficient: single DELETE query instead of N queries
    await this.permissionRepo.delete({ occupation: { id: occupationId } });

    // 2. If no permissions to add (occupation cleared), we're done
    if (permissions.length === 0) {
      return;
    }

    // 3. Get all templates with their selected activities
    const templates = await this.templateRepo.find({
      relations: ['selectedActivities'],
    });

    // 4. Build a map of activity IDs to permissions for quick lookup
    // Only include Y and LC permissions (N means "no permission" = no record)
    const permissionMap = new Map<string, string>();
    for (const p of permissions) {
      if (p.permission === Permissions.PERFORM || p.permission === Permissions.LIMITS) {
        permissionMap.set(p.careActivityId, p.permission);
      }
    }

    // 5. Collect all new permissions to insert across all templates
    const newPermissions: CareSettingTemplatePermission[] = [];

    for (const template of templates) {
      // For each activity in this template, check if the occupation has permission
      for (const activity of template.selectedActivities) {
        const permission = permissionMap.get(activity.id);
        if (permission) {
          newPermissions.push(
            this.permissionRepo.create({
              template: { id: template.id },
              occupation: { id: occupationId },
              careActivity: { id: activity.id },
              permission: permission as Permissions,
            }),
          );
        }
      }
    }

    // 6. Batch insert all new permissions (efficient: single INSERT with multiple rows)
    if (newPermissions.length > 0) {
      await this.permissionRepo.save(newPermissions);
    }
  }

  /**
   * Remove all permissions for an occupation from ALL templates.
   * Called when an occupation is soft-deleted from CMS.
   *
   * @param occupationId - The occupation being deleted
   */
  async removeOccupationFromAllTemplates(occupationId: string): Promise<void> {
    await this.permissionRepo.delete({ occupation: { id: occupationId } });
  }

  /**
   * Find or create master templates for a batch of units within a transaction.
   * Used by bulk upload to ensure every unit has a master template before
   * syncing activities and permissions.
   *
   * @param manager - Transaction EntityManager (all DB ops go through this)
   * @param units - Units that need master templates
   * @returns Map of unitId -> masterTemplateId
   */
  async findOrCreateMasterTemplates(
    manager: EntityManager,
    units: Unit[],
  ): Promise<Map<string, string>> {
    if (units.length === 0) return new Map();

    const unitIds = units.map(u => u.id);

    // Find existing master templates for these units
    const existing = await manager
      .createQueryBuilder()
      .select('cst.id', 'id')
      .addSelect('cst.unit_id', 'unit_id')
      .from('care_setting_template', 'cst')
      .where('cst.unit_id IN (:...unitIds)', { unitIds })
      .andWhere('cst.is_master = true')
      .getRawMany();

    const result = new Map<string, string>();
    const existingUnitIds = new Set<string>();

    for (const row of existing) {
      result.set(row.unit_id, row.id);
      existingUnitIds.add(row.unit_id);
    }

    // Create master templates for units that don't have one
    // Uses manager.save() to stay in sync with entity definition (avoids raw SQL column drift)
    const unitsWithoutMaster = units.filter(u => !existingUnitIds.has(u.id));

    for (const unit of unitsWithoutMaster) {
      const template = manager.create(CareSettingTemplate, {
        name: `${unit.displayName}${MASTER_TEMPLATE_SUFFIX}`,
        isMaster: true,
        healthAuthority: 'GLOBAL',
        unit,
      });
      const saved = await manager.save(CareSettingTemplate, template);
      result.set(unit.id, saved.id);
    }

    return result;
  }

  /**
   * Sync bulk upload data to master templates within a transaction.
   * Adds activities and bundles to templates, upserts Y/LC permissions,
   * and removes N permissions.
   *
   * @param manager - Transaction EntityManager
   * @param templatesByUnitId - Map of unitId -> masterTemplateId
   * @param activities - Saved CareActivity entities
   * @param activityUnitMapping - Map of activityId -> Set of unitIds
   * @param activityBundleMapping - Map of activityId -> bundleId (built pre-save to avoid relying on TypeORM preserving relations)
   * @param allowedActivities - Y/LC permission partials (with full entity refs)
   * @param disallowedActivities - N permission partials (to delete from templates)
   */
  async syncBulkUploadToTemplates(
    manager: EntityManager,
    templatesByUnitId: Map<string, string>,
    activities: CareActivity[],
    activityUnitMapping: Map<string, Set<string>>,
    activityBundleMapping: Map<string, string>,
    allowedActivities: Partial<AllowedActivity>[],
    disallowedActivities: Partial<AllowedActivity>[],
  ): Promise<void> {
    // 1. Sync activities and bundles to templates
    const activityInserts: { templateId: string; activityId: string }[] = [];
    const bundleInserts: { templateId: string; bundleId: string }[] = [];
    const bundlesSeen = new Set<string>();

    for (const activity of activities) {
      const unitIds = activityUnitMapping.get(activity.id);
      if (!unitIds) continue;

      for (const unitId of unitIds) {
        const templateId = templatesByUnitId.get(unitId);
        if (!templateId) continue;

        activityInserts.push({ templateId, activityId: activity.id });

        // Use pre-save mapping instead of activity.bundle?.id — TypeORM's save()
        // doesn't guarantee relation objects survive the round-trip
        const bundleId = activityBundleMapping.get(activity.id);
        if (bundleId) {
          const key = `${templateId}-${bundleId}`;
          if (!bundlesSeen.has(key)) {
            bundlesSeen.add(key);
            bundleInserts.push({ templateId, bundleId });
          }
        }
      }
    }

    // Batch insert activities with ON CONFLICT DO NOTHING
    const BATCH_SIZE = 5000;
    if (activityInserts.length > 0) {
      for (const batch of _.chunk(activityInserts, BATCH_SIZE)) {
        const values = batch.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
        const params = batch.flatMap(a => [a.templateId, a.activityId]);
        await manager.query(
          `INSERT INTO care_setting_template_activities (care_setting_template_id, care_activity_id)
           VALUES ${values} ON CONFLICT DO NOTHING`,
          params,
        );
      }
    }

    // Batch insert bundles with ON CONFLICT DO NOTHING
    if (bundleInserts.length > 0) {
      for (const batch of _.chunk(bundleInserts, BATCH_SIZE)) {
        const values = batch.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
        const params = batch.flatMap(b => [b.templateId, b.bundleId]);
        await manager.query(
          `INSERT INTO care_setting_template_bundles (care_setting_template_id, bundle_id)
           VALUES ${values} ON CONFLICT DO NOTHING`,
          params,
        );
      }
    }

    // 2. Upsert Y/LC permissions to care_setting_template_permission
    const permInserts: {
      templateId: string;
      activityId: string;
      occupationId: string;
      permission: string;
    }[] = [];

    for (const aa of allowedActivities) {
      const unitId = aa.unit?.id;
      const activityId = aa.careActivity?.id;
      const occupationId = aa.occupation?.id;
      const permission = aa.permission;
      if (!unitId || !activityId || !occupationId || !permission) continue;

      const templateId = templatesByUnitId.get(unitId);
      if (!templateId) continue;

      permInserts.push({ templateId, activityId, occupationId, permission });
    }

    if (permInserts.length > 0) {
      // 4 params per row → chunk at ~4000 to stay under PG's 65535 param limit
      for (const batch of _.chunk(permInserts, 4000)) {
        const values = batch
          .map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`)
          .join(', ');
        const params = batch.flatMap(p => [
          p.templateId,
          p.activityId,
          p.occupationId,
          p.permission,
        ]);
        await manager.query(
          `INSERT INTO care_setting_template_permission
             (template_id, care_activity_id, occupation_id, permission)
           VALUES ${values}
           ON CONFLICT ON CONSTRAINT template_activity_occupation
           DO UPDATE SET permission = EXCLUDED.permission, updated_at = NOW()`,
          params,
        );
      }
    }

    // 3. Delete N permissions from care_setting_template_permission
    const deleteTriples: { templateId: string; activityId: string; occupationId: string }[] = [];

    for (const da of disallowedActivities) {
      const unitId = da.unit?.id;
      const activityId = da.careActivity?.id;
      const occupationId = da.occupation?.id;
      if (!unitId || !activityId || !occupationId) continue;

      const templateId = templatesByUnitId.get(unitId);
      if (!templateId) continue;

      deleteTriples.push({ templateId, activityId, occupationId });
    }

    if (deleteTriples.length > 0) {
      for (const chunk of _.chunk(deleteTriples, 100)) {
        const conditions = chunk
          .map(
            (_, i) =>
              `(template_id = $${i * 3 + 1} AND care_activity_id = $${i * 3 + 2} AND occupation_id = $${i * 3 + 3})`,
          )
          .join(' OR ');
        const params = chunk.flatMap(d => [d.templateId, d.activityId, d.occupationId]);
        await manager.query(
          `DELETE FROM care_setting_template_permission WHERE ${conditions}`,
          params,
        );
      }
    }
  }
}
