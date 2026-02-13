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
import { Unit } from './entity/unit.entity';
import { Bundle } from '../care-activity/entity/bundle.entity';
import { CareActivity } from '../care-activity/entity/care-activity.entity';
import { Occupation } from '../occupation/entity/occupation.entity';
import { AllowedActivity } from '../allowed-activity/entity/allowed-activity.entity';
import { FindCareSettingTemplatesDto } from './dto/find-care-setting-templates.dto';
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
  ) {}

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
   * Check if a template name already exists within a unit for a health authority
   * Names must be unique within the combination of unit + health authority
   * @param name - The name to check
   * @param unitId - The unit to check within
   * @param healthAuthority - The health authority to scope the check
   * @param excludeId - Optional template ID to exclude (for updates)
   * @throws BadRequestException if a duplicate name exists
   */
  private async checkDuplicateName(
    name: string,
    unitId: string,
    healthAuthority: string,
    excludeId?: string,
  ): Promise<void> {
    const queryBuilder = this.templateRepo
      .createQueryBuilder('t')
      .where('LOWER(t.name) = LOWER(:name)', { name: name.trim() })
      .andWhere('t.unit.id = :unitId', { unitId })
      .andWhere('t.healthAuthority = :healthAuthority', { healthAuthority });

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

    // Sort - always put masters first, then by requested sort
    const sortOrder = query.sortOrder || SortOrder.ASC;

    if (query.sortBy) {
      let orderBy = `t.${query.sortBy}`;

      if (query.sortBy === CareSettingsCMSFindSortKeys.PARENT_NAME) {
        orderBy = 't_parent.name';
      }

      queryBuilder.orderBy('t.isMaster', 'DESC').addOrderBy(orderBy, sortOrder as SortOrder);
    } else {
      // Default: masters first, then by name
      queryBuilder.orderBy('t.isMaster', 'DESC').addOrderBy('t.name', 'ASC');
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
    const rawPermissions = await this.permissionRepo
      .createQueryBuilder('p')
      .select('p.care_activity_id', 'care_activity_id')
      .addSelect('p.occupation_id', 'occupation_id')
      .addSelect('p.permission', 'permission')
      .where('p.template_id = :templateId', { templateId: id })
      .getRawMany();

    const permissions = rawPermissions.map(
      p =>
        new TemplatePermissionRO({
          activityId: p.care_activity_id,
          occupationId: p.occupation_id,
          permission: p.permission,
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
    permissions: { activityId: string; occupationId: string; permission: string }[];
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
      .where('p.template_id = :templateId', { templateId: id })
      .getRawMany();

    return {
      id: template.id,
      name: template.name,
      unitId: template.unit.id,
      selectedBundleIds: template.selectedBundles.map(b => b.id),
      selectedActivityIds: template.selectedActivities.map(a => a.id),
      permissions: permissions.map(p => ({
        activityId: p.care_activity_id,
        occupationId: p.occupation_id,
        permission: p.permission,
      })),
    };
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

  /**
   * Create a copy of an existing template
   * Copies all selected bundles, activities, and permissions
   * The new template is always non-master and references the source as parent
   * @param sourceId - ID of template to copy
   * @param dto - Copy configuration (name)
   * @param healthAuthority - Health authority for the new template (from user's organization)
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
      ],
    });

    if (!source) {
      throw new NotFoundException({ message: 'Source template not found' });
    }

    // Check for duplicate name before creating copy (scoped to HA)
    await this.checkDuplicateName(dto.name, source.unit.id, healthAuthority);

    // Create new template (createdBy/updatedBy auto-set by AuditSubscriber)
    const newTemplate = this.templateRepo.create({
      name: dto.name,
      isMaster: false,
      healthAuthority,
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
    await this.checkDuplicateName(dto.name, source.unit.id, healthAuthority);

    // Get selected bundles
    const selectedBundles = await this.bundleRepo.find({
      where: { id: In(dto.selectedBundleIds) },
    });

    // Get selected activities
    const selectedActivities = await this.careActivityRepo.find({
      where: { id: In(dto.selectedActivityIds) },
    });

    // Create new template with provided data
    const newTemplate = this.templateRepo.create({
      name: dto.name,
      isMaster: false,
      healthAuthority,
      unit: source.unit,
      parent: source,
      selectedBundles,
      selectedActivities,
    });

    const saved = await this.templateRepo.save(newTemplate);

    // Create permissions
    if (dto.permissions && dto.permissions.length > 0) {
      const activities = await this.careActivityRepo.find({
        where: { id: In(dto.permissions.map(p => p.activityId)) },
      });
      const activityMap = new Map(activities.map(a => [a.id, a]));

      const occupations = await this.occupationRepo.find({
        where: { id: In(dto.permissions.map(p => p.occupationId)) },
      });
      const occupationMap = new Map(occupations.map(o => [o.id, o]));

      const newPermissions = dto.permissions
        .filter(p => activityMap.has(p.activityId) && occupationMap.has(p.occupationId))
        .map(p =>
          this.permissionRepo.create({
            template: saved,
            careActivity: activityMap.get(p.activityId)!,
            occupation: occupationMap.get(p.occupationId)!,
            permission: p.permission,
          }),
        );

      if (newPermissions.length > 0) {
        await this.permissionRepo.save(newPermissions);
      }
    }

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
      await this.checkDuplicateName(dto.name, template.unit.id, template.healthAuthority, id);
      template.name = dto.name;
    }

    // Update selected bundles
    const selectedBundles = await this.bundleRepo.find({
      where: { id: In(dto.selectedBundleIds) },
    });
    template.selectedBundles = selectedBundles;

    // Update selected activities
    const selectedActivities = await this.careActivityRepo.find({
      where: { id: In(dto.selectedActivityIds) },
    });
    template.selectedActivities = selectedActivities;

    // updatedBy auto-set by AuditSubscriber
    await this.templateRepo.save(template);

    // Update permissions - delete all and recreate
    await this.permissionRepo.delete({ template: { id } });

    if (dto.permissions && dto.permissions.length > 0) {
      const activities = await this.careActivityRepo.find({
        where: { id: In(dto.permissions.map(p => p.activityId)) },
      });
      const activityMap = new Map(activities.map(a => [a.id, a]));

      const occupations = await this.occupationRepo.find({
        where: { id: In(dto.permissions.map(p => p.occupationId)) },
      });
      const occupationMap = new Map(occupations.map(o => [o.id, o]));

      const newPermissions = dto.permissions
        .filter(p => activityMap.has(p.activityId) && occupationMap.has(p.occupationId))
        .map(p =>
          this.permissionRepo.create({
            template,
            careActivity: activityMap.get(p.activityId)!,
            occupation: occupationMap.get(p.occupationId)!,
            permission: p.permission,
          }),
        );

      if (newPermissions.length > 0) {
        await this.permissionRepo.save(newPermissions);
      }
    }
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

    // Check if any draft sessions reference this template (raw query to avoid module coupling)
    const result = await this.templateRepo.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('planning_session', 'ps')
      .where('ps.care_setting_template_id = :id', { id })
      .andWhere('ps.status = :status', { status: 'DRAFT' })
      .getRawOne();

    if (parseInt(result.count) > 0) {
      throw new BadRequestException(
        `Cannot delete template: it is referenced by ${result.count} draft care plan(s).`,
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
