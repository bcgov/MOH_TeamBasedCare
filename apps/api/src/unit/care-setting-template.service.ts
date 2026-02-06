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
import { In, Repository } from 'typeorm';
import { CareSettingTemplate } from './entity/care-setting-template.entity';
import { CareSettingTemplatePermission } from './entity/care-setting-template-permission.entity';
import { Unit } from './entity/unit.entity';
import { Bundle } from '../care-activity/entity/bundle.entity';
import { CareActivity } from '../care-activity/entity/care-activity.entity';
import { Occupation } from '../occupation/entity/occupation.entity';
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
} from '@tbcm/common';

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
    healthAuthority: string,
  ): Promise<[CareSettingTemplateRO[], number]> {
    const queryBuilder = this.templateRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.unit', 't_unit')
      .leftJoinAndSelect('t.parent', 't_parent');

    // Filter by health authority - show user's HA templates + GLOBAL masters
    if (healthAuthority) {
      queryBuilder.where('(t.healthAuthority = :healthAuthority OR t.healthAuthority = :global)', {
        healthAuthority,
        global: 'GLOBAL',
      });
    } else {
      // Users without org only see GLOBAL templates
      queryBuilder.where('t.healthAuthority = :global', { global: 'GLOBAL' });
    }

    // Search by name
    if (query.searchText) {
      queryBuilder.andWhere('t.name ILIKE :name', {
        name: `%${query.searchText}%`,
      });
    }

    // Sort
    const sortOrder = query.sortOrder || SortOrder.ASC;

    if (query.sortBy) {
      let orderBy = `t.${query.sortBy}`;

      if (query.sortBy === CareSettingsCMSFindSortKeys.PARENT_NAME) {
        orderBy = 't_parent.name';
      }

      queryBuilder.orderBy(orderBy, sortOrder as SortOrder);
    } else {
      // Default sort by name
      queryBuilder.orderBy('t.name', 'ASC');
    }

    // Pagination
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;

    const [results, count] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return [results.map(t => new CareSettingTemplateRO(t)), count];
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
        'permissions',
        'permissions.careActivity',
        'permissions.occupation',
      ],
    });

    if (!template) {
      throw new NotFoundException({ message: 'Care Setting Template not found' });
    }

    // Build bundle selections with activity counts
    const selectedBundles = await this.buildBundleSelections(template);

    // Build permissions
    const permissions = template.permissions.map(
      p =>
        new TemplatePermissionRO({
          activityId: p.careActivity.id,
          occupationId: p.occupation.id,
          permission: p.permission,
        }),
    );

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
    const permissions = await this.permissionRepo
      .createQueryBuilder('p')
      .select(['p.careActivityId', 'p.occupationId', 'p.permission'])
      .where('p.templateId = :templateId', { templateId: id })
      .getRawMany();

    return {
      id: template.id,
      name: template.name,
      unitId: template.unit.id,
      selectedBundleIds: template.selectedBundles.map(b => b.id),
      selectedActivityIds: template.selectedActivities.map(a => a.id),
      permissions: permissions.map(p => ({
        activityId: p.p_careActivityId || p.p_care_activity_id,
        occupationId: p.p_occupationId || p.p_occupation_id,
        permission: p.p_permission,
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
   */
  async findAllForPlanning(healthAuthority: string): Promise<CareSettingTemplateRO[]> {
    const templates = await this.templateRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.unit', 't_unit')
      .leftJoinAndSelect('t.parent', 't_parent')
      .where('(t.healthAuthority = :ha OR t.healthAuthority = :global)', {
        ha: healthAuthority,
        global: 'GLOBAL',
      })
      .orderBy('t.name', 'ASC')
      .getMany();
    return templates.map(t => new CareSettingTemplateRO(t));
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
}
