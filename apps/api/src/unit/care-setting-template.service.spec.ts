import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CareSettingTemplateService } from './care-setting-template.service';
import { CareSettingTemplate } from './entity/care-setting-template.entity';
import { CareSettingTemplatePermission } from './entity/care-setting-template-permission.entity';
import { Unit } from './entity/unit.entity';
import { Bundle } from '../care-activity/entity/bundle.entity';
import { CareActivity } from '../care-activity/entity/care-activity.entity';
import { Occupation } from '../occupation/entity/occupation.entity';
import { AllowedActivity } from '../allowed-activity/entity/allowed-activity.entity';
import { LimitCondition } from './entity/limit-condition.entity';
import {
  CareSettingsCMSFindSortKeys,
  MAX_TEMPLATE_CHANGE_ITEMS,
  Permissions,
  SortOrder,
  TemplateLevel,
  TemplateLevelFilter,
} from '@tbcm/common';
import { TemplateVersionConflictException } from './template-version-conflict.exception';

describe('CareSettingTemplateService', () => {
  let service: CareSettingTemplateService;

  const createMockQueryBuilder = () => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    getOne: jest.fn(),
    getRawMany: jest.fn(),
    getRawOne: jest.fn(),
    from: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
  });

  let mockTemplateQB: ReturnType<typeof createMockQueryBuilder>;
  let mockPermissionQB: ReturnType<typeof createMockQueryBuilder>;
  let mockBundleQB: ReturnType<typeof createMockQueryBuilder>;
  let mockAllowedActivityQB: ReturnType<typeof createMockQueryBuilder>;
  let mockManagerQB: ReturnType<typeof createMockQueryBuilder>;

  const mockTemplateRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
    manager: {
      createQueryBuilder: jest.fn(),
      transaction: jest.fn(),
      query: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
    },
  };

  const mockPermissionRepo = {
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
  };

  const mockUnitRepo = { find: jest.fn() };
  const mockBundleRepo = { find: jest.fn(), createQueryBuilder: jest.fn() };
  const mockCareActivityRepo = { find: jest.fn() };
  const mockOccupationRepo = { find: jest.fn() };
  const mockAllowedActivityRepo = { find: jest.fn(), createQueryBuilder: jest.fn() };
  const mockLimitConditionRepo = { find: jest.fn(), findOne: jest.fn() };

  /**
   * Stand-in for the transactional EntityManager. Runs the callback inline so
   * the sequencing inside the transaction (version guard, then delete, then
   * recreate) is observable in tests.
   */
  const mockManager = {
    query: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    create: jest.fn((_entity: unknown, data: unknown) => data),
    findOne: jest.fn(),
  };

  // Mock entities
  const mockUnit = { id: 'unit-1', displayName: 'Emergency Department' };
  const mockParent = { id: 'parent-1', name: 'Master Template' };
  const mockBundle = { id: 'bundle-1', displayName: 'Bundle A', careActivities: [] };
  const mockActivity = { id: 'activity-1', displayName: 'Activity 1' };
  const mockOccupation = { id: 'occ-1', displayName: 'Registered Nurse' };

  const mockTemplate = {
    id: 'tmpl-1',
    name: 'Test Template',
    isMaster: false,
    healthAuthority: 'Fraser Health',
    unit: mockUnit,
    parent: mockParent,
    selectedBundles: [mockBundle],
    selectedActivities: [mockActivity],
    permissions: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPermissionRepo.find.mockResolvedValue([]);

    mockTemplateQB = createMockQueryBuilder();
    mockPermissionQB = createMockQueryBuilder();
    mockBundleQB = createMockQueryBuilder();
    mockAllowedActivityQB = createMockQueryBuilder();
    mockManagerQB = createMockQueryBuilder();

    mockTemplateRepo.createQueryBuilder.mockReturnValue(mockTemplateQB);
    mockPermissionRepo.createQueryBuilder.mockReturnValue(mockPermissionQB);
    mockBundleRepo.createQueryBuilder.mockReturnValue(mockBundleQB);
    mockAllowedActivityRepo.createQueryBuilder.mockReturnValue(mockAllowedActivityQB);
    mockTemplateRepo.manager.createQueryBuilder.mockReturnValue(mockManagerQB);

    // Raw queries default to "no rows" so a test only has to state the data it
    // actually cares about.
    mockTemplateQB.getRawMany.mockResolvedValue([]);
    mockPermissionQB.getRawMany.mockResolvedValue([]);
    mockBundleQB.getRawMany.mockResolvedValue([]);
    mockManagerQB.getRawMany.mockResolvedValue([]);
    mockAllowedActivityRepo.find.mockResolvedValue([]);
    mockAllowedActivityQB.getRawMany.mockResolvedValue([]);
    mockLimitConditionRepo.find.mockResolvedValue([]);

    mockManager.query.mockReset();
    mockManager.save.mockReset();
    mockManager.delete.mockReset();
    mockManager.findOne.mockReset();
    mockManager.create.mockImplementation((_entity: unknown, data: unknown) => data);
    // Default: the guarded UPDATE claims the row and returns the new version
    mockManager.query.mockResolvedValue([[{ version: 4 }], 1]);
    mockTemplateRepo.manager.transaction.mockImplementation(
      async (cb: (m: typeof mockManager) => Promise<unknown>) => cb(mockManager),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CareSettingTemplateService,
        { provide: getRepositoryToken(CareSettingTemplate), useValue: mockTemplateRepo },
        {
          provide: getRepositoryToken(CareSettingTemplatePermission),
          useValue: mockPermissionRepo,
        },
        { provide: getRepositoryToken(Unit), useValue: mockUnitRepo },
        { provide: getRepositoryToken(Bundle), useValue: mockBundleRepo },
        { provide: getRepositoryToken(CareActivity), useValue: mockCareActivityRepo },
        { provide: getRepositoryToken(Occupation), useValue: mockOccupationRepo },
        { provide: getRepositoryToken(AllowedActivity), useValue: mockAllowedActivityRepo },
        { provide: getRepositoryToken(LimitCondition), useValue: mockLimitConditionRepo },
      ],
    }).compile();

    service = module.get<CareSettingTemplateService>(CareSettingTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getTemplateBasic ──────────────────────────────────────────────
  describe('getTemplateBasic', () => {
    it('should return template id and healthAuthority', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({
        id: 'tmpl-1',
        healthAuthority: 'Fraser Health',
      });

      const result = await service.getTemplateBasic('tmpl-1');

      expect(result).toEqual({ id: 'tmpl-1', healthAuthority: 'Fraser Health' });
      expect(mockTemplateRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'tmpl-1' },
        select: ['id', 'healthAuthority'],
      });
    });

    it('should throw NotFoundException when not found', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(null);

      await expect(service.getTemplateBasic('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findTemplates ─────────────────────────────────────────────────
  describe('findTemplates', () => {
    beforeEach(() => {
      mockTemplateQB.getManyAndCount.mockResolvedValue([[mockTemplate], 1]);
      // getMissingPermissionsCountBatch uses manager QB with getRawMany
      mockManagerQB.getRawMany.mockResolvedValue([]);
    });

    it('should return paginated results with defaults', async () => {
      const [results, count] = await service.findTemplates(
        { page: 1, pageSize: 10 } as any,
        'Fraser Health',
      );

      expect(count).toBe(1);
      expect(results).toHaveLength(1);
      expect(mockTemplateQB.skip).toHaveBeenCalledWith(0);
      expect(mockTemplateQB.take).toHaveBeenCalledWith(10);
    });

    it('should filter by HA + GLOBAL for non-admin users', async () => {
      await service.findTemplates({ page: 1, pageSize: 10 } as any, 'Fraser Health');

      expect(mockTemplateQB.where).toHaveBeenCalledWith(
        '(t.healthAuthority = :healthAuthority OR t.healthAuthority = :global)',
        { healthAuthority: 'Fraser Health', global: 'GLOBAL' },
      );
    });

    it('should filter GLOBAL only for empty HA string', async () => {
      await service.findTemplates({ page: 1, pageSize: 10 } as any, '');

      expect(mockTemplateQB.where).toHaveBeenCalledWith('t.healthAuthority = :global', {
        global: 'GLOBAL',
      });
    });

    it('should show all templates when HA is null (admin)', async () => {
      await service.findTemplates({ page: 1, pageSize: 10 } as any, null);

      expect(mockTemplateQB.where).not.toHaveBeenCalled();
    });

    it('should apply search text ILIKE filter', async () => {
      await service.findTemplates({ page: 1, pageSize: 10, searchText: 'acute' } as any, null);

      expect(mockTemplateQB.andWhere).toHaveBeenCalledWith('t.name ILIKE :name', {
        name: '%acute%',
      });
    });

    it('should sort by isMaster DESC then PARENT_NAME', async () => {
      await service.findTemplates(
        {
          page: 1,
          pageSize: 10,
          sortBy: CareSettingsCMSFindSortKeys.PARENT_NAME,
          sortOrder: SortOrder.ASC,
        } as any,
        null,
      );

      expect(mockTemplateQB.orderBy).toHaveBeenCalledWith('t.isMaster', 'DESC');
      expect(mockTemplateQB.addOrderBy).toHaveBeenCalledWith('t_parent.name', 'ASC');
    });

    it('should sort by isMaster DESC then custom field', async () => {
      await service.findTemplates(
        {
          page: 1,
          pageSize: 10,
          sortBy: CareSettingsCMSFindSortKeys.NAME,
          sortOrder: SortOrder.DESC,
        } as any,
        null,
      );

      expect(mockTemplateQB.orderBy).toHaveBeenCalledWith('t.isMaster', 'DESC');
      expect(mockTemplateQB.addOrderBy).toHaveBeenCalledWith('t.name', 'DESC');
    });

    it('should default sort by isMaster DESC then createdAt DESC', async () => {
      await service.findTemplates({ page: 1, pageSize: 10 } as any, null);

      expect(mockTemplateQB.orderBy).toHaveBeenCalledWith('t.isMaster', 'DESC');
      expect(mockTemplateQB.addOrderBy).toHaveBeenCalledWith('t.createdAt', 'DESC');
    });

    it('should calculate correct skip for page 3', async () => {
      await service.findTemplates({ page: 3, pageSize: 5 } as any, null);

      expect(mockTemplateQB.skip).toHaveBeenCalledWith(10);
      expect(mockTemplateQB.take).toHaveBeenCalledWith(5);
    });

    it('should join unit and parent relations', async () => {
      await service.findTemplates({ page: 1, pageSize: 10 } as any, null);

      expect(mockTemplateQB.leftJoinAndSelect).toHaveBeenCalledWith('t.unit', 't_unit');
      expect(mockTemplateQB.leftJoinAndSelect).toHaveBeenCalledWith('t.parent', 't_parent');
    });
  });

  // ─── getTemplateById ───────────────────────────────────────────────
  describe('getTemplateById', () => {
    it('should return template detail with bundles and permissions from raw query', async () => {
      // Entity has 2 permissions via relation, but raw query returns only 1.
      // Result should have 1 — proving the raw query path is used.
      const templateWithPerms = {
        ...mockTemplate,
        permissions: [
          { careActivity: { id: 'a-1' }, occupation: { id: 'o-1' }, permission: 'Y' },
          { careActivity: { id: 'a-2' }, occupation: { id: 'o-2' }, permission: 'LC' },
        ],
      };
      mockTemplateRepo.findOne.mockResolvedValue(templateWithPerms);
      mockBundleQB.getMany.mockResolvedValue([]);
      mockPermissionQB.getRawMany.mockResolvedValue([
        { care_activity_id: 'a-1', occupation_id: 'o-1', permission: 'Y' },
      ]);

      const result = await service.getTemplateById('tmpl-1');

      expect(result).toBeDefined();
      expect(result.permissions).toHaveLength(1);
    });

    it('should suppress limit details on non-LC permissions', async () => {
      // A stale limit column left behind by an older write must not be read
      // back as an active limit; edit-wrapper keys off limitId alone.
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockBundleQB.getMany.mockResolvedValue([]);
      mockPermissionQB.getRawMany.mockResolvedValue([
        {
          care_activity_id: 'a-1',
          occupation_id: 'o-1',
          permission: Permissions.PERFORM,
          limit_condition_id: 'limit-1',
          limit_name: 'Supervision required',
          restriction_description: 'Stale text',
        },
        {
          care_activity_id: 'a-2',
          occupation_id: 'o-2',
          permission: Permissions.LIMITS,
          limit_condition_id: 'limit-2',
          limit_name: 'Day shift only',
          restriction_description: 'Kept',
        },
      ]);

      const result = await service.getTemplateById('tmpl-1');

      const performing = result.permissions.find(p => p.activityId === 'a-1');
      expect(performing?.limitId).toBeNull();
      expect(performing?.limitName).toBeNull();
      expect(performing?.restrictionDescription).toBeNull();

      // An LC cell keeps its curated details.
      const limited = result.permissions.find(p => p.activityId === 'a-2');
      expect(limited?.limitId).toBe('limit-2');
      expect(limited?.limitName).toBe('Day shift only');
      expect(limited?.restrictionDescription).toBe('Kept');
    });

    it('should throw NotFoundException when not found', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(null);

      await expect(service.getTemplateById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getTemplateForCopy ────────────────────────────────────────────
  describe('getTemplateForCopy', () => {
    it('should return lightweight data with IDs', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(mockTemplate);
      mockPermissionQB.getRawMany.mockResolvedValue([
        { care_activity_id: 'a-1', occupation_id: 'o-1', permission: 'Y' },
      ]);

      const result = await service.getTemplateForCopy('tmpl-1');

      expect(result.id).toBe('tmpl-1');
      expect(result.unitId).toBe('unit-1');
      expect(result.selectedBundleIds).toEqual(['bundle-1']);
      expect(result.selectedActivityIds).toEqual(['activity-1']);
      expect(result.permissions).toEqual([
        {
          activityId: 'a-1',
          occupationId: 'o-1',
          permission: 'Y',
          limitId: null,
          restrictionDescription: null,
        },
      ]);
    });

    it('should throw NotFoundException when not found', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(null);

      await expect(service.getTemplateForCopy('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should query permissions with snake_case column names', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(mockTemplate);
      mockPermissionQB.getRawMany.mockResolvedValue([]);

      await service.getTemplateForCopy('tmpl-1');

      expect(mockPermissionQB.select).toHaveBeenCalledWith(
        'p.care_activity_id',
        'care_activity_id',
      );
      expect(mockPermissionQB.where).toHaveBeenCalledWith('p.template_id = :templateId', {
        templateId: 'tmpl-1',
      });
    });

    it('should not consult the occupation scope for a non-master template', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(mockTemplate);
      mockPermissionQB.getRawMany.mockResolvedValue([]);

      const result = await service.getTemplateForCopy('tmpl-1');

      expect(mockAllowedActivityRepo.createQueryBuilder).not.toHaveBeenCalled();
      expect(result.permissions).toEqual([]);
    });

    it('should fill a master template gaps from the occupation scope', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate, isMaster: true });
      mockPermissionQB.getRawMany.mockResolvedValue([]);
      mockAllowedActivityQB.getRawMany.mockResolvedValue([
        {
          care_activity_id: 'activity-1',
          occupation_id: 'occ-1',
          permission: Permissions.PERFORM,
        },
      ]);

      const result = await service.getTemplateForCopy('tmpl-1');

      expect(mockAllowedActivityQB.where).toHaveBeenCalledWith(
        'aa.care_activity_id IN (:...activityIds)',
        { activityIds: ['activity-1'] },
      );
      expect(mockAllowedActivityQB.andWhere).toHaveBeenCalledWith(
        '(aa.unit_id = :unitId OR aa.unit_id IS NULL)',
        { unitId: 'unit-1' },
      );
      // The column's enum only holds Y and LC, so comparing it against N is a
      // Postgres error rather than a no-op filter.
      expect(mockAllowedActivityQB.andWhere).toHaveBeenCalledTimes(1);
      expect(result.permissions).toEqual([
        {
          activityId: 'activity-1',
          occupationId: 'occ-1',
          permission: Permissions.PERFORM,
          limitId: null,
          restrictionDescription: null,
        },
      ]);
    });

    it('should let a master stored permission win over the occupation scope', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate, isMaster: true });
      mockPermissionQB.getRawMany.mockResolvedValue([
        {
          care_activity_id: 'activity-1',
          occupation_id: 'occ-1',
          permission: Permissions.LIMITS,
          limit_condition_id: 'limit-1',
          restriction_description: 'Supervision required',
        },
      ]);
      mockAllowedActivityQB.getRawMany.mockResolvedValue([
        {
          care_activity_id: 'activity-1',
          occupation_id: 'occ-1',
          permission: Permissions.PERFORM,
        },
        {
          care_activity_id: 'activity-1',
          occupation_id: 'occ-2',
          permission: Permissions.PERFORM,
        },
      ]);

      const result = await service.getTemplateForCopy('tmpl-1');

      expect(result.permissions).toEqual([
        {
          activityId: 'activity-1',
          occupationId: 'occ-1',
          permission: Permissions.LIMITS,
          limitId: 'limit-1',
          restrictionDescription: 'Supervision required',
        },
        {
          activityId: 'activity-1',
          occupationId: 'occ-2',
          permission: Permissions.PERFORM,
          limitId: null,
          restrictionDescription: null,
        },
      ]);
    });
  });

  // ─── getTemplateForPlanning ────────────────────────────────────────
  describe('getTemplateForPlanning', () => {
    it('should return template with unit and activities', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(mockTemplate);

      const result = await service.getTemplateForPlanning('tmpl-1');

      expect(result).toEqual(mockTemplate);
      expect(mockTemplateRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'tmpl-1' },
        relations: ['unit', 'selectedActivities'],
      });
    });

    it('should throw NotFoundException when not found', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(null);

      await expect(service.getTemplateForPlanning('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── getBundlesForTemplate ─────────────────────────────────────────
  describe('getBundlesForTemplate', () => {
    it('should return BundleRO array ordered by displayName', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(mockTemplate);
      mockBundleQB.getMany.mockResolvedValue([mockBundle]);

      const result = await service.getBundlesForTemplate('tmpl-1');

      expect(result).toHaveLength(1);
      expect(mockBundleQB.orderBy).toHaveBeenCalledWith('b.displayName', 'ASC');
    });

    it('should throw NotFoundException when template not found', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(null);

      await expect(service.getBundlesForTemplate('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getOccupationsForTemplate ─────────────────────────────────────
  describe('getOccupationsForTemplate', () => {
    it('should return OccupationRO array', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(mockTemplate);
      mockOccupationRepo.find.mockResolvedValue([mockOccupation]);

      const result = await service.getOccupationsForTemplate('tmpl-1');

      expect(result).toHaveLength(1);
      expect(mockOccupationRepo.find).toHaveBeenCalledWith({
        order: { displayName: 'ASC' },
      });
    });

    it('should throw NotFoundException when template not found', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(null);

      await expect(service.getOccupationsForTemplate('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── copyTemplate ──────────────────────────────────────────────────
  describe('copyTemplate', () => {
    const sourceWithPerms = {
      ...mockTemplate,
      id: 'source-1',
      permissions: [{ careActivity: { id: 'a-1' }, occupation: { id: 'o-1' }, permission: 'Y' }],
    };

    beforeEach(() => {
      // Default: no duplicate name
      mockTemplateQB.getOne.mockResolvedValue(null);
    });

    it('should create a copy with source data', async () => {
      mockTemplateRepo.findOne
        .mockResolvedValueOnce(sourceWithPerms) // source lookup
        .mockResolvedValueOnce({ ...mockTemplate, id: 'new-1' }); // reload
      mockTemplateRepo.create.mockReturnValue({ ...mockTemplate, id: 'new-1' });
      mockTemplateRepo.save.mockResolvedValue({ ...mockTemplate, id: 'new-1' });
      mockPermissionRepo.create.mockReturnValue({});
      mockPermissionRepo.save.mockResolvedValue([]);

      const result = await service.copyTemplate(
        'source-1',
        { name: 'Copy' } as any,
        'Fraser Health',
      );

      expect(result).toBeDefined();
      expect(mockTemplateRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Copy',
          isMaster: false,
          healthAuthority: 'Fraser Health',
        }),
      );
    });

    it('should throw NotFoundException when source not found', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(null);

      await expect(
        service.copyTemplate('nonexistent', { name: 'Copy' } as any, 'Fraser Health'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on duplicate name', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(sourceWithPerms);
      mockTemplateQB.getOne.mockResolvedValue({ id: 'existing' }); // duplicate found

      await expect(
        service.copyTemplate('source-1', { name: 'Duplicate' } as any, 'Fraser Health'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set isMaster=false and parent=source', async () => {
      mockTemplateRepo.findOne
        .mockResolvedValueOnce(sourceWithPerms)
        .mockResolvedValueOnce({ ...mockTemplate, id: 'new-1' });
      mockTemplateRepo.create.mockReturnValue({ id: 'new-1' });
      mockTemplateRepo.save.mockResolvedValue({ id: 'new-1' });
      mockPermissionRepo.create.mockReturnValue({});
      mockPermissionRepo.save.mockResolvedValue([]);

      await service.copyTemplate('source-1', { name: 'Copy' } as any, 'Fraser Health');

      expect(mockTemplateRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isMaster: false,
          parent: sourceWithPerms,
        }),
      );
    });

    it('should save permissions when source has permissions', async () => {
      mockTemplateRepo.findOne
        .mockResolvedValueOnce(sourceWithPerms)
        .mockResolvedValueOnce({ ...mockTemplate, id: 'new-1' });
      mockTemplateRepo.create.mockReturnValue({ id: 'new-1' });
      mockTemplateRepo.save.mockResolvedValue({ id: 'new-1' });
      mockPermissionRepo.create.mockReturnValue({});
      mockPermissionRepo.save.mockResolvedValue([]);

      await service.copyTemplate('source-1', { name: 'Copy' } as any, 'Fraser Health');

      expect(mockPermissionRepo.create).toHaveBeenCalledTimes(1);
      expect(mockPermissionRepo.save).toHaveBeenCalled();
    });

    it('should skip permissions save when source has no permissions', async () => {
      const sourceNoPerms = { ...sourceWithPerms, permissions: [] };
      mockTemplateRepo.findOne
        .mockResolvedValueOnce(sourceNoPerms)
        .mockResolvedValueOnce({ ...mockTemplate, id: 'new-1' });
      mockTemplateRepo.create.mockReturnValue({ id: 'new-1' });
      mockTemplateRepo.save.mockResolvedValue({ id: 'new-1' });

      await service.copyTemplate('source-1', { name: 'Copy' } as any, 'Fraser Health');

      expect(mockPermissionRepo.save).not.toHaveBeenCalled();
    });
  });

  // ─── copyTemplateWithData ──────────────────────────────────────────
  describe('copyTemplateWithData', () => {
    beforeEach(() => {
      mockTemplateQB.getOne.mockResolvedValue(null); // no duplicate name
      // Template and permissions are now written through the transaction manager
      mockManager.save.mockResolvedValue({ id: 'new-1' });
    });

    it('should create copy with custom data', async () => {
      mockTemplateRepo.findOne
        .mockResolvedValueOnce(mockTemplate)
        .mockResolvedValueOnce({ ...mockTemplate, id: 'new-1' });
      mockTemplateRepo.create.mockReturnValue({ id: 'new-1' });
      mockBundleRepo.find.mockResolvedValue([mockBundle]);
      mockCareActivityRepo.find.mockResolvedValue([mockActivity]);

      const dto = {
        name: 'Custom Copy',
        selectedBundleIds: ['bundle-1'],
        selectedActivityIds: ['activity-1'],
        permissions: [],
      };

      const result = await service.copyTemplateWithData('tmpl-1', dto as any, 'Fraser Health');

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when source not found', async () => {
      mockTemplateRepo.findOne.mockReset();
      mockTemplateRepo.findOne.mockResolvedValue(null);

      await expect(
        service.copyTemplateWithData('nonexistent', {} as any, 'Fraser Health'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on duplicate name', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(mockTemplate);
      mockTemplateQB.getOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.copyTemplateWithData('tmpl-1', { name: 'Dup' } as any, 'Fraser Health'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create permissions from dto', async () => {
      mockTemplateRepo.findOne
        .mockResolvedValueOnce(mockTemplate)
        .mockResolvedValueOnce({ ...mockTemplate, id: 'new-1' });
      mockTemplateRepo.create.mockReturnValue({ id: 'new-1' });
      mockBundleRepo.find.mockResolvedValue([mockBundle]);
      mockCareActivityRepo.find
        .mockResolvedValueOnce([mockActivity]) // selectedActivities
        .mockResolvedValueOnce([mockActivity]); // permissions activities
      mockOccupationRepo.find.mockResolvedValue([mockOccupation]);

      const dto = {
        name: 'Copy',
        selectedBundleIds: ['bundle-1'],
        selectedActivityIds: ['activity-1'],
        permissions: [{ activityId: 'activity-1', occupationId: 'occ-1', permission: 'Y' }],
      };

      await service.copyTemplateWithData('tmpl-1', dto as any, 'Fraser Health');

      expect(mockManager.create).toHaveBeenCalledWith(
        CareSettingTemplatePermission,
        expect.objectContaining({ permission: 'Y' }),
      );
      expect(mockManager.save).toHaveBeenCalledWith(
        CareSettingTemplatePermission,
        expect.any(Array),
      );
    });

    // The template row and its permissions must land together: a template saved
    // ahead of a failing permission write would block the retry on its own name.
    it('writes the template and its permissions in one transaction', async () => {
      mockTemplateRepo.findOne
        .mockResolvedValueOnce(mockTemplate)
        .mockResolvedValueOnce({ ...mockTemplate, id: 'new-1' });
      mockTemplateRepo.create.mockReturnValue({ id: 'new-1' });
      mockBundleRepo.find.mockResolvedValue([]);
      mockCareActivityRepo.find.mockResolvedValue([]);
      mockOccupationRepo.find.mockResolvedValue([]);

      await service.copyTemplateWithData(
        'tmpl-1',
        { name: 'Copy', selectedBundleIds: [], selectedActivityIds: [], permissions: [] } as any,
        'Fraser Health',
      );

      expect(mockTemplateRepo.manager.transaction).toHaveBeenCalledTimes(1);
      expect(mockTemplateRepo.save).not.toHaveBeenCalled();
    });

    // An unusable limit must be caught before the template row exists, or the
    // rejected copy leaves an orphan behind.
    it('rejects an LC permission with no limit before writing anything', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(mockTemplate);
      mockTemplateRepo.create.mockReturnValue({ id: 'new-1' });
      mockBundleRepo.find.mockResolvedValue([]);
      mockCareActivityRepo.find.mockResolvedValue([mockActivity]);
      mockOccupationRepo.find.mockResolvedValue([mockOccupation]);

      await expect(
        service.copyTemplateWithData(
          'tmpl-1',
          {
            name: 'Copy',
            selectedBundleIds: [],
            selectedActivityIds: [],
            permissions: [{ activityId: 'activity-1', occupationId: 'occ-1', permission: 'LC' }],
          } as any,
          'Fraser Health',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockTemplateRepo.save).not.toHaveBeenCalled();
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    // The wizard resubmits inherited permissions verbatim, and an LC cell
    // inherited from a template that predates limits carries none. Rejecting it
    // would make the source uncopyable: an untouched cell shows no badge, so
    // there is no way to open the limits dialog and attach one.
    it('carries an inherited limit-less LC cell over from the source', async () => {
      mockTemplateRepo.findOne
        .mockResolvedValueOnce(mockTemplate)
        .mockResolvedValueOnce({ ...mockTemplate, id: 'new-1' });
      mockTemplateRepo.create.mockReturnValue({ id: 'new-1' });
      mockBundleRepo.find.mockResolvedValue([]);
      mockCareActivityRepo.find.mockResolvedValue([mockActivity]);
      mockOccupationRepo.find.mockResolvedValue([mockOccupation]);
      mockPermissionQB.getRawMany.mockResolvedValue([
        { care_activity_id: 'activity-1', occupation_id: 'occ-1' },
      ]);

      await service.copyTemplateWithData(
        'tmpl-1',
        {
          name: 'Copy',
          selectedBundleIds: [],
          selectedActivityIds: [],
          permissions: [{ activityId: 'activity-1', occupationId: 'occ-1', permission: 'LC' }],
        } as any,
        'Fraser Health',
      );

      // The exemption is read from the source, not from the copy, which has no
      // stored permissions yet.
      expect(mockPermissionQB.where).toHaveBeenCalledWith(expect.any(String), {
        templateId: 'tmpl-1',
      });
      expect(mockManager.create).toHaveBeenCalledWith(
        CareSettingTemplatePermission,
        expect.objectContaining({ permission: 'LC', limitCondition: null }),
      );
    });

    it('still rejects a cell newly set to LC when the source exempts a different cell', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(mockTemplate);
      mockTemplateRepo.create.mockReturnValue({ id: 'new-1' });
      mockBundleRepo.find.mockResolvedValue([]);
      mockCareActivityRepo.find.mockResolvedValue([mockActivity]);
      mockOccupationRepo.find.mockResolvedValue([mockOccupation]);
      mockPermissionQB.getRawMany.mockResolvedValue([
        { care_activity_id: 'other-activity', occupation_id: 'other-occ' },
      ]);

      await expect(
        service.copyTemplateWithData(
          'tmpl-1',
          {
            name: 'Copy',
            selectedBundleIds: [],
            selectedActivityIds: [],
            permissions: [{ activityId: 'activity-1', occupationId: 'occ-1', permission: 'LC' }],
          } as any,
          'Fraser Health',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('should skip invalid permissions where activity/occupation not found', async () => {
      mockTemplateRepo.findOne
        .mockResolvedValueOnce(mockTemplate)
        .mockResolvedValueOnce({ ...mockTemplate, id: 'new-1' });
      mockTemplateRepo.create.mockReturnValue({ id: 'new-1' });
      mockBundleRepo.find.mockResolvedValue([]);
      mockCareActivityRepo.find
        .mockResolvedValueOnce([]) // selectedActivities
        .mockResolvedValueOnce([]); // permission lookup - activity not found
      mockOccupationRepo.find.mockResolvedValue([]); // occupation not found

      const dto = {
        name: 'Copy',
        selectedBundleIds: [],
        selectedActivityIds: [],
        permissions: [{ activityId: 'missing-a', occupationId: 'missing-o', permission: 'Y' }],
      };

      await service.copyTemplateWithData('tmpl-1', dto as any, 'Fraser Health');

      // No permissions created since activity/occupation not found
      expect(mockManager.create).not.toHaveBeenCalled();
    });
  });

  // ─── updateTemplate ────────────────────────────────────────────────
  describe('updateTemplate', () => {
    beforeEach(() => {
      mockTemplateQB.getOne.mockResolvedValue(null); // no duplicate
    });

    it('should update template', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockTemplateRepo.save.mockResolvedValue(mockTemplate);
      mockBundleRepo.find.mockResolvedValue([mockBundle]);
      mockCareActivityRepo.find.mockResolvedValue([mockActivity]);
      mockPermissionRepo.delete.mockResolvedValue({});

      const dto = {
        name: 'Updated Name',
        selectedBundleIds: ['bundle-1'],
        selectedActivityIds: ['activity-1'],
        permissions: [],
      };

      await service.updateTemplate('tmpl-1', dto as any);

      // Written through the transaction manager, not the bare repository
      expect(mockManager.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(null);

      await expect(service.updateTemplate('nonexistent', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when template is master', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate, isMaster: true });

      await expect(service.updateTemplate('tmpl-1', {} as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException when HA mismatch', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({
        ...mockTemplate,
        healthAuthority: 'Fraser Health',
      });

      await expect(service.updateTemplate('tmpl-1', {} as any, 'Interior Health')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should check duplicate name only when name changes', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockTemplateRepo.save.mockResolvedValue(mockTemplate);
      mockBundleRepo.find.mockResolvedValue([]);
      mockCareActivityRepo.find.mockResolvedValue([]);
      mockPermissionRepo.delete.mockResolvedValue({});

      // Same name as existing template
      await service.updateTemplate('tmpl-1', {
        name: 'Test Template',
        selectedBundleIds: [],
        selectedActivityIds: [],
        permissions: [],
      } as any);

      // checkDuplicateName should NOT have been called (name didn't change)
      expect(mockTemplateQB.getOne).not.toHaveBeenCalled();
    });

    it('should upsert submitted permissions without a wholesale delete', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockTemplateRepo.save.mockResolvedValue(mockTemplate);
      mockBundleRepo.find.mockResolvedValue([]);
      mockCareActivityRepo.find.mockResolvedValue([mockActivity]);
      mockOccupationRepo.find.mockResolvedValue([mockOccupation]);
      await service.updateTemplate('tmpl-1', {
        selectedBundleIds: [],
        selectedActivityIds: [],
        permissions: [{ activityId: 'activity-1', occupationId: 'occ-1', permission: 'Y' }],
      } as any);

      expect(mockManager.delete).not.toHaveBeenCalledWith(CareSettingTemplatePermission, {
        template: { id: 'tmpl-1' },
      });
      expect(mockManager.query).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT ON CONSTRAINT template_activity_occupation'),
        expect.arrayContaining(['tmpl-1', 'activity-1', 'occ-1', Permissions.PERFORM]),
      );
    });

    it('should skip permission writes when the full grid is unchanged and empty', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockTemplateRepo.save.mockResolvedValue(mockTemplate);
      mockBundleRepo.find.mockResolvedValue([]);
      mockCareActivityRepo.find.mockResolvedValue([]);
      await service.updateTemplate('tmpl-1', {
        selectedBundleIds: [],
        selectedActivityIds: [],
        permissions: [],
      } as any);

      expect(
        mockManager.query.mock.calls.some(([sql]) =>
          String(sql).includes('DELETE FROM care_setting_template_permission'),
        ),
      ).toBe(false);
      expect(mockManager.save).toHaveBeenCalledTimes(1);
    });

    it('writes only an explicit delta permission upsert', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockCareActivityRepo.find.mockResolvedValue([mockActivity]);
      mockOccupationRepo.find.mockResolvedValue([mockOccupation]);

      await service.updateTemplate('tmpl-1', {
        changes: {
          permissionUpserts: [
            { activityId: 'activity-1', occupationId: 'occ-1', permission: Permissions.PERFORM },
          ],
          permissionRemovals: [],
          selectedBundleIdsToAdd: [],
          selectedBundleIdsToRemove: [],
          selectedActivityIdsToAdd: [],
          selectedActivityIdsToRemove: [],
        },
      } as any);

      expect(mockManager.query).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT ON CONSTRAINT template_activity_occupation'),
        ['tmpl-1', 'activity-1', 'occ-1', Permissions.PERFORM, null, null],
      );
      expect(
        mockManager.query.mock.calls.some(([sql]) =>
          String(sql).startsWith('DELETE FROM care_setting_template_permission'),
        ),
      ).toBe(false);
    });

    it('deletes only an explicit delta permission pair', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockCareActivityRepo.find.mockResolvedValue([mockActivity]);
      mockOccupationRepo.find.mockResolvedValue([mockOccupation]);

      await service.updateTemplate('tmpl-1', {
        changes: {
          permissionUpserts: [],
          permissionRemovals: [{ activityId: 'activity-1', occupationId: 'occ-1' }],
          selectedBundleIdsToAdd: [],
          selectedBundleIdsToRemove: [],
          selectedActivityIdsToAdd: [],
          selectedActivityIdsToRemove: [],
        },
      } as any);

      expect(mockManager.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'DELETE FROM care_setting_template_permission WHERE (template_id = $1 AND care_activity_id = $2 AND occupation_id = $3)',
        ),
        ['tmpl-1', 'activity-1', 'occ-1'],
      );
    });

    it('writes an LC detail-only delta as a single upsert', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockCareActivityRepo.find.mockResolvedValue([mockActivity]);
      mockOccupationRepo.find.mockResolvedValue([mockOccupation]);
      mockLimitConditionRepo.find.mockResolvedValue([{ id: 'limit-1', name: 'Supervision' }]);

      await service.updateTemplate('tmpl-1', {
        changes: {
          permissionUpserts: [
            {
              activityId: 'activity-1',
              occupationId: 'occ-1',
              permission: Permissions.LIMITS,
              limitId: 'limit-1',
              restrictionDescription: 'Supervision required',
            },
          ],
          permissionRemovals: [],
          selectedBundleIdsToAdd: [],
          selectedBundleIdsToRemove: [],
          selectedActivityIdsToAdd: [],
          selectedActivityIdsToRemove: [],
        },
      } as any);

      expect(mockManager.query).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT ON CONSTRAINT template_activity_occupation'),
        ['tmpl-1', 'activity-1', 'occ-1', Permissions.LIMITS, 'limit-1', 'Supervision required'],
      );
    });

    it('applies only explicit delta relation additions and removals', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockBundleRepo.find.mockResolvedValue([mockBundle]);
      mockCareActivityRepo.find.mockResolvedValue([mockActivity]);

      await service.updateTemplate('tmpl-1', {
        changes: {
          permissionUpserts: [],
          permissionRemovals: [],
          selectedBundleIdsToAdd: ['bundle-1'],
          selectedBundleIdsToRemove: [],
          selectedActivityIdsToAdd: [],
          selectedActivityIdsToRemove: ['activity-1'],
        },
      } as any);

      expect(mockManager.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO care_setting_template_bundles'),
        ['tmpl-1', 'bundle-1'],
      );
      expect(mockManager.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM care_setting_template_activities'),
        ['tmpl-1', 'activity-1'],
      );
    });

    it('does not write unchanged full-grid permissions', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockCareActivityRepo.find.mockResolvedValue([mockActivity]);
      mockOccupationRepo.find.mockResolvedValue([mockOccupation]);
      mockManager.query.mockImplementation(async sql => {
        if (String(sql).includes('version = version + 1')) return [[{ version: 4 }], 1];
        if (String(sql).includes('SELECT care_activity_id')) {
          return [
            {
              care_activity_id: 'activity-1',
              occupation_id: 'occ-1',
              permission: Permissions.PERFORM,
              limit_condition_id: null,
              restriction_description: null,
            },
          ];
        }
        return [];
      });

      await service.updateTemplate('tmpl-1', {
        selectedBundleIds: [],
        selectedActivityIds: [],
        permissions: [
          { activityId: 'activity-1', occupationId: 'occ-1', permission: Permissions.PERFORM },
        ],
      } as any);

      expect(
        mockManager.query.mock.calls.some(([sql]) =>
          String(sql).includes('ON CONFLICT ON CONSTRAINT template_activity_occupation'),
        ),
      ).toBe(false);
      expect(
        mockManager.query.mock.calls.some(([sql]) =>
          String(sql).startsWith('DELETE FROM care_setting_template_permission'),
        ),
      ).toBe(false);
    });

    it('deletes a permission omitted from a compatible full-grid save', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockManager.query.mockImplementation(async sql => {
        if (String(sql).includes('version = version + 1')) return [[{ version: 4 }], 1];
        if (String(sql).includes('SELECT care_activity_id')) {
          return [
            {
              care_activity_id: 'activity-1',
              occupation_id: 'occ-1',
              permission: Permissions.PERFORM,
              limit_condition_id: null,
              restriction_description: null,
            },
          ];
        }
        return [];
      });

      await service.updateTemplate('tmpl-1', {
        selectedBundleIds: [],
        selectedActivityIds: [],
        permissions: [],
      } as any);

      expect(mockManager.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'DELETE FROM care_setting_template_permission WHERE (template_id = $1 AND care_activity_id = $2 AND occupation_id = $3)',
        ),
        ['tmpl-1', 'activity-1', 'occ-1'],
      );
    });

    it('upserts a changed compatible full-grid permission value', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockCareActivityRepo.find.mockResolvedValue([mockActivity]);
      mockOccupationRepo.find.mockResolvedValue([mockOccupation]);
      mockLimitConditionRepo.find.mockResolvedValue([{ id: 'limit-1', name: 'Supervision' }]);
      mockManager.query.mockImplementation(async sql => {
        if (String(sql).includes('version = version + 1')) return [[{ version: 4 }], 1];
        if (String(sql).includes('SELECT care_activity_id')) {
          return [
            {
              care_activity_id: 'activity-1',
              occupation_id: 'occ-1',
              permission: Permissions.PERFORM,
              limit_condition_id: null,
              restriction_description: null,
            },
          ];
        }
        return [];
      });

      await service.updateTemplate('tmpl-1', {
        selectedBundleIds: [],
        selectedActivityIds: [],
        permissions: [
          {
            activityId: 'activity-1',
            occupationId: 'occ-1',
            permission: Permissions.LIMITS,
            limitId: 'limit-1',
          },
        ],
      } as any);

      expect(mockManager.query).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT ON CONSTRAINT template_activity_occupation'),
        ['tmpl-1', 'activity-1', 'occ-1', Permissions.LIMITS, 'limit-1', null],
      );
    });

    it('rejects a mixed full-grid and delta service payload before claiming a version', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });

      await expect(
        service.updateTemplate('tmpl-1', {
          selectedBundleIds: [],
          selectedActivityIds: [],
          permissions: [],
          changes: {
            permissionUpserts: [],
            permissionRemovals: [],
            selectedBundleIdsToAdd: [],
            selectedBundleIdsToRemove: [],
            selectedActivityIdsToAdd: [],
            selectedActivityIdsToRemove: [],
          },
        } as any),
      ).rejects.toThrow(BadRequestException);

      expect(mockTemplateRepo.manager.transaction).not.toHaveBeenCalled();
    });

    it('rejects an oversized delta collection before claiming a version', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });

      await expect(
        service.updateTemplate('tmpl-1', {
          changes: {
            permissionUpserts: [],
            permissionRemovals: [],
            selectedBundleIdsToAdd: Array.from(
              { length: MAX_TEMPLATE_CHANGE_ITEMS + 1 },
              (_, index) => `bundle-${index}`,
            ),
            selectedBundleIdsToRemove: [],
            selectedActivityIdsToAdd: [],
            selectedActivityIdsToRemove: [],
          },
        } as any),
      ).rejects.toThrow(BadRequestException);

      expect(mockTemplateRepo.manager.transaction).not.toHaveBeenCalled();
    });
  });

  // ─── deleteTemplate ────────────────────────────────────────────────
  describe('deleteTemplate', () => {
    it('should delete template and permissions', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockManagerQB.getRawOne.mockResolvedValue({ count: '0' });
      mockPermissionRepo.delete.mockResolvedValue({});
      mockTemplateRepo.delete.mockResolvedValue({});

      await service.deleteTemplate('tmpl-1');

      expect(mockPermissionRepo.delete).toHaveBeenCalledWith({ template: { id: 'tmpl-1' } });
      expect(mockTemplateRepo.delete).toHaveBeenCalledWith({ id: 'tmpl-1' });
    });

    it('should throw NotFoundException when not found', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteTemplate('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when template is master', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate, isMaster: true });

      await expect(service.deleteTemplate('tmpl-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when HA mismatch', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({
        ...mockTemplate,
        healthAuthority: 'Fraser Health',
      });

      await expect(service.deleteTemplate('tmpl-1', 'Interior Health')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException when sessions reference template', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockManagerQB.getRawOne.mockResolvedValue({ count: '3' });

      await expect(service.deleteTemplate('tmpl-1')).rejects.toThrow(BadRequestException);
    });

    it('should allow deletion when no sessions reference template', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockManagerQB.getRawOne.mockResolvedValue({ count: '0' });
      mockPermissionRepo.delete.mockResolvedValue({});
      mockTemplateRepo.delete.mockResolvedValue({});

      await expect(service.deleteTemplate('tmpl-1')).resolves.not.toThrow();
    });

    /**
     * Regression (FR-048). The guard previously compared `ps.status = 'DRAFT'` while
     * PlanningStatus.DRAFT is the lowercase 'draft' actually stored. Postgres string
     * comparison is case-sensitive, so the count was always 0 and the guard never fired.
     * The status filter is now gone entirely: every referencing session blocks deletion.
     */
    it('should count referencing sessions without filtering on status', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockManagerQB.getRawOne.mockResolvedValue({ count: '1' });

      await expect(service.deleteTemplate('tmpl-1')).rejects.toThrow(BadRequestException);

      expect(mockManagerQB.where).toHaveBeenCalledWith('ps.care_setting_template_id = :id', {
        id: 'tmpl-1',
      });
      // No status clause of any casing may be applied
      expect(mockManagerQB.andWhere).not.toHaveBeenCalled();
      expect(mockTemplateRepo.delete).not.toHaveBeenCalled();
    });

    it('should refuse deletion when only a published session references the template', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      // The raw count does not distinguish status — a published-only reference still counts
      mockManagerQB.getRawOne.mockResolvedValue({ count: '1' });

      await expect(service.deleteTemplate('tmpl-1')).rejects.toThrow(BadRequestException);
    });

    it('should not describe the referencing sessions as drafts', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockManagerQB.getRawOne.mockResolvedValue({ count: '2' });

      await expect(service.deleteTemplate('tmpl-1')).rejects.toThrow(
        'Cannot delete template: it is referenced by 2 care plan(s).',
      );
    });
  });

  // ─── findAllForPlanning ────────────────────────────────────────────
  describe('findAllForPlanning', () => {
    it('should return HA + GLOBAL templates ordered by name', async () => {
      mockTemplateQB.getMany.mockResolvedValue([mockTemplate]);

      const result = await service.findAllForPlanning('Fraser Health');

      expect(result).toHaveLength(1);
      expect(mockTemplateQB.where).toHaveBeenCalledWith(
        '(t.healthAuthority = :ha OR t.healthAuthority = :global)',
        { ha: 'Fraser Health', global: 'GLOBAL' },
      );
      expect(mockTemplateQB.orderBy).toHaveBeenCalledWith('t.name', 'ASC');
    });

    it('should join unit and parent relations', async () => {
      mockTemplateQB.getMany.mockResolvedValue([]);

      await service.findAllForPlanning('Fraser Health');

      expect(mockTemplateQB.leftJoinAndSelect).toHaveBeenCalledWith('t.unit', 't_unit');
      expect(mockTemplateQB.leftJoinAndSelect).toHaveBeenCalledWith('t.parent', 't_parent');
    });
  });

  // ─── findAllForCMSFilter ───────────────────────────────────────────
  describe('findAllForCMSFilter', () => {
    it('should return all templates without pagination', async () => {
      mockTemplateQB.getMany.mockResolvedValue([mockTemplate]);

      const result = await service.findAllForCMSFilter('Fraser Health');

      expect(result).toHaveLength(1);
      expect(mockTemplateQB.getMany).toHaveBeenCalled();
      expect(mockTemplateQB.skip).not.toHaveBeenCalled();
      expect(mockTemplateQB.take).not.toHaveBeenCalled();
    });

    it('should filter by HA + GLOBAL for non-admin users', async () => {
      mockTemplateQB.getMany.mockResolvedValue([]);

      await service.findAllForCMSFilter('Fraser Health');

      expect(mockTemplateQB.where).toHaveBeenCalledWith(
        '(t.healthAuthority = :healthAuthority OR t.healthAuthority = :global)',
        { healthAuthority: 'Fraser Health', global: 'GLOBAL' },
      );
    });

    it('should show only GLOBAL templates when HA is empty string', async () => {
      mockTemplateQB.getMany.mockResolvedValue([]);

      await service.findAllForCMSFilter('');

      expect(mockTemplateQB.where).toHaveBeenCalledWith('t.healthAuthority = :global', {
        global: 'GLOBAL',
      });
    });

    it('should show all templates when HA is null (admin)', async () => {
      mockTemplateQB.getMany.mockResolvedValue([]);

      await service.findAllForCMSFilter(null);

      // null HA means no where clause applied
      expect(mockTemplateQB.where).not.toHaveBeenCalled();
    });
  });

  // ─── getPermissionsForGap ──────────────────────────────────────────
  describe('getPermissionsForGap', () => {
    it('should return permissions for given activity and occupation IDs', async () => {
      const mockPerms = [{ permission: 'Y', care_activity_id: 'a-1', occupation_id: 'o-1' }];
      mockPermissionQB.getRawMany.mockResolvedValue(mockPerms);

      const result = await service.getPermissionsForGap('tmpl-1', ['a-1'], ['o-1']);

      expect(result).toEqual(mockPerms);
      expect(mockPermissionQB.where).toHaveBeenCalledWith('cstp.template = :templateId', {
        templateId: 'tmpl-1',
      });
    });

    it('should return empty array when careActivityIds is empty', async () => {
      const result = await service.getPermissionsForGap('tmpl-1', [], ['o-1']);

      expect(result).toEqual([]);
      expect(mockPermissionQB.getRawMany).not.toHaveBeenCalled();
    });

    it('should return empty array when occupationIds is empty', async () => {
      const result = await service.getPermissionsForGap('tmpl-1', ['a-1'], []);

      expect(result).toEqual([]);
      expect(mockPermissionQB.getRawMany).not.toHaveBeenCalled();
    });
  });

  // ─── getPermissionsForSuggestions ──────────────────────────────────
  describe('getPermissionsForSuggestions', () => {
    it('should return Y/LC permissions with occupation names', async () => {
      const mockPerms = [
        {
          permission: 'Y',
          care_activity_id: 'a-1',
          occupation_id: 'o-1',
          occupation_name: 'Nurse',
        },
      ];
      mockPermissionQB.getRawMany.mockResolvedValue(mockPerms);

      const result = await service.getPermissionsForSuggestions('tmpl-1', ['a-1']);

      expect(result).toEqual(mockPerms);
      expect(mockPermissionQB.andWhere).toHaveBeenCalledWith('cstp.permission IN (:...perms)', {
        perms: ['Y', 'LC'],
      });
    });

    it('should return empty array when careActivityIds is empty', async () => {
      const result = await service.getPermissionsForSuggestions('tmpl-1', []);

      expect(result).toEqual([]);
      expect(mockPermissionQB.getRawMany).not.toHaveBeenCalled();
    });
  });

  // ─── Batched writes ───────────────────────────────────────────────
  describe('updateTemplate - write batching', () => {
    beforeEach(() => {
      mockTemplateQB.getOne.mockResolvedValue(null);
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockTemplateRepo.save.mockResolvedValue(mockTemplate);
      mockBundleRepo.find.mockResolvedValue([]);
    });

    /** Collects every parameter array passed to a matching SQL statement. */
    const parametersFor = (fragment: string) =>
      mockManager.query.mock.calls
        .filter(([sql]) => String(sql).includes(fragment))
        .map(([, params]) => params as unknown[]);

    it('deletes every removal when the full grid exceeds the delta cap', async () => {
      // The full-grid path derives removals from stored rows, so it is not
      // bounded by MAX_TEMPLATE_CHANGE_ITEMS the way a delta save is.
      const storedCount = MAX_TEMPLATE_CHANGE_ITEMS + 600;
      const storedRows = Array.from({ length: storedCount }, (_value, index) => ({
        care_activity_id: `activity-${index}`,
        occupation_id: 'occ-1',
        permission: Permissions.PERFORM,
        limit_condition_id: null,
        restriction_description: null,
      }));

      mockCareActivityRepo.find.mockResolvedValue([]);
      mockOccupationRepo.find.mockResolvedValue([]);
      mockManager.query.mockImplementation(async sql => {
        if (String(sql).includes('version = version + 1')) return [[{ version: 4 }], 1];
        if (String(sql).includes('SELECT care_activity_id')) return storedRows;
        return [];
      });

      await service.updateTemplate('tmpl-1', {
        selectedBundleIds: [],
        selectedActivityIds: [],
        permissions: [],
      } as any);

      const deletedActivityIds = new Set<unknown>();
      for (const params of parametersFor('DELETE FROM care_setting_template_permission')) {
        for (let index = 1; index < params.length; index += 3) {
          deletedActivityIds.add(params[index]);
        }
      }

      expect(deletedActivityIds.size).toBe(storedCount);
      expect(deletedActivityIds.has(`activity-${storedCount - 1}`)).toBe(true);
    });

    it('chunks upserts so a large full grid stays under the bind parameter limit', async () => {
      const upsertCount = MAX_TEMPLATE_CHANGE_ITEMS + 1;
      const permissions = Array.from({ length: upsertCount }, (_value, index) => ({
        activityId: `activity-${index}`,
        occupationId: 'occ-1',
        permission: Permissions.PERFORM,
      }));

      mockCareActivityRepo.find.mockResolvedValue(
        permissions.map(permission => ({ id: permission.activityId })),
      );
      mockOccupationRepo.find.mockResolvedValue([mockOccupation]);
      mockManager.query.mockImplementation(async sql => {
        if (String(sql).includes('version = version + 1')) return [[{ version: 4 }], 1];
        return [];
      });

      await service.updateTemplate('tmpl-1', {
        selectedBundleIds: [],
        selectedActivityIds: [],
        permissions,
      } as any);

      const insertParameters = parametersFor('ON CONFLICT ON CONSTRAINT');
      expect(insertParameters.length).toBeGreaterThan(1);
      for (const params of insertParameters) {
        expect(params.length).toBeLessThanOrEqual(65535);
      }
      // 6 bind parameters per row, so every row must be accounted for.
      const insertedRows = insertParameters.reduce((total, params) => total + params.length / 6, 0);
      expect(insertedRows).toBe(upsertCount);
    });
  });

  // ─── syncOccupationToAllTemplates ─────────────────────────────────
  describe('syncOccupationToAllTemplates', () => {
    it('should delete existing permissions and create new ones for all templates', async () => {
      const mockTemplates = [
        {
          id: 'tmpl-1',
          selectedActivities: [{ id: 'a-1' }, { id: 'a-2' }],
        },
        {
          id: 'tmpl-2',
          selectedActivities: [{ id: 'a-1' }, { id: 'a-3' }],
        },
      ];
      mockTemplateRepo.find.mockResolvedValue(mockTemplates);
      mockPermissionRepo.delete.mockResolvedValue({});
      mockPermissionRepo.create.mockImplementation(data => data);
      mockManager.save.mockResolvedValue([]);

      const permissions = [
        { careActivityId: 'a-1', permission: 'Y' },
        { careActivityId: 'a-2', permission: 'LC' },
      ];

      await service.syncOccupationToAllTemplates('occ-1', permissions);

      // Should delete all existing permissions for this occupation
      expect(mockManager.delete).toHaveBeenCalledWith(CareSettingTemplatePermission, {
        occupation: { id: 'occ-1' },
      });

      // Should load all templates with selectedActivities
      expect(mockTemplateRepo.find).toHaveBeenCalledWith({
        relations: ['selectedActivities'],
      });

      // Should create permissions:
      // - tmpl-1: a-1(Y), a-2(LC) - both activities are in template
      // - tmpl-2: a-1(Y) only - a-2 is not in this template, a-3 has no permission
      expect(mockManager.save).toHaveBeenCalled();
      const savedPermissions = mockManager.save.mock.calls[0][1];
      expect(savedPermissions).toHaveLength(3); // 2 for tmpl-1, 1 for tmpl-2
    });

    it('should only delete permissions when permissions array is empty', async () => {
      mockPermissionRepo.delete.mockResolvedValue({});

      await service.syncOccupationToAllTemplates('occ-1', []);

      expect(mockManager.delete).toHaveBeenCalledWith(CareSettingTemplatePermission, {
        occupation: { id: 'occ-1' },
      });
      expect(mockTemplateRepo.find).not.toHaveBeenCalled();
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('should filter out N permissions (only sync Y and LC)', async () => {
      const mockTemplates = [
        {
          id: 'tmpl-1',
          selectedActivities: [{ id: 'a-1' }, { id: 'a-2' }],
        },
      ];
      mockTemplateRepo.find.mockResolvedValue(mockTemplates);
      mockPermissionRepo.delete.mockResolvedValue({});
      mockPermissionRepo.create.mockImplementation(data => data);
      mockManager.save.mockResolvedValue([]);

      const permissions = [
        { careActivityId: 'a-1', permission: 'Y' },
        { careActivityId: 'a-2', permission: 'N' }, // This should be filtered out
      ];

      await service.syncOccupationToAllTemplates('occ-1', permissions);

      const savedPermissions = mockManager.save.mock.calls[0][1];
      expect(savedPermissions).toHaveLength(1); // Only Y permission
      expect(savedPermissions[0].careActivity.id).toBe('a-1');
    });

    it('should not save when no matching permissions for templates', async () => {
      const mockTemplates = [
        {
          id: 'tmpl-1',
          selectedActivities: [{ id: 'a-3' }], // Different activity
        },
      ];
      mockTemplateRepo.find.mockResolvedValue(mockTemplates);
      mockPermissionRepo.delete.mockResolvedValue({});

      const permissions = [{ careActivityId: 'a-1', permission: 'Y' }];

      await service.syncOccupationToAllTemplates('occ-1', permissions);

      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('should preserve curated limits when a cell stays LC', async () => {
      const mockTemplates = [{ id: 'tmpl-1', selectedActivities: [{ id: 'a-1' }, { id: 'a-2' }] }];
      const limit = { id: 'limit-1', name: 'Supervision required' };
      mockTemplateRepo.find.mockResolvedValue(mockTemplates);
      mockPermissionRepo.delete.mockResolvedValue({});
      mockPermissionRepo.create.mockImplementation(data => data);
      mockManager.save.mockResolvedValue([]);
      mockPermissionRepo.find.mockResolvedValue([
        {
          template: { id: 'tmpl-1' },
          careActivity: { id: 'a-2' },
          permission: Permissions.LIMITS,
          limitCondition: limit,
          restrictionDescription: 'Only during day shift',
        },
      ]);

      await service.syncOccupationToAllTemplates('occ-1', [
        { careActivityId: 'a-1', permission: 'Y' },
        { careActivityId: 'a-2', permission: 'LC' },
      ]);

      // Limits must be read before the bulk delete removes the rows.
      expect(mockPermissionRepo.find).toHaveBeenCalled();
      const saved = mockManager.save.mock.calls[0][1];
      const restored = saved.find((p: any) => p.careActivity.id === 'a-2');
      expect(restored.limitCondition).toBe(limit);
      expect(restored.restrictionDescription).toBe('Only during day shift');

      // A Y cell must never carry a limit.
      const performing = saved.find((p: any) => p.careActivity.id === 'a-1');
      expect(performing.limitCondition).toBeNull();
      expect(performing.restrictionDescription).toBeNull();
    });

    it('should drop the limit when a cell moves from LC to Y', async () => {
      const mockTemplates = [{ id: 'tmpl-1', selectedActivities: [{ id: 'a-1' }] }];
      mockTemplateRepo.find.mockResolvedValue(mockTemplates);
      mockPermissionRepo.delete.mockResolvedValue({});
      mockPermissionRepo.create.mockImplementation(data => data);
      mockManager.save.mockResolvedValue([]);
      mockPermissionRepo.find.mockResolvedValue([
        {
          template: { id: 'tmpl-1' },
          careActivity: { id: 'a-1' },
          permission: Permissions.LIMITS,
          limitCondition: { id: 'limit-1' },
          restrictionDescription: 'Stale',
        },
      ]);

      await service.syncOccupationToAllTemplates('occ-1', [
        { careActivityId: 'a-1', permission: 'Y' },
        { careActivityId: 'a-9', permission: 'LC' },
      ]);

      const saved = mockManager.save.mock.calls[0][1];
      expect(saved[0].limitCondition).toBeNull();
      expect(saved[0].restrictionDescription).toBeNull();
    });

    it('should not query for limits when no incoming permission is LC', async () => {
      mockTemplateRepo.find.mockResolvedValue([
        { id: 'tmpl-1', selectedActivities: [{ id: 'a-1' }] },
      ]);
      mockPermissionRepo.delete.mockResolvedValue({});
      mockPermissionRepo.create.mockImplementation(data => data);
      mockManager.save.mockResolvedValue([]);

      await service.syncOccupationToAllTemplates('occ-1', [
        { careActivityId: 'a-1', permission: 'Y' },
      ]);

      expect(mockPermissionRepo.find).not.toHaveBeenCalled();
    });

    it('should delete and re-insert inside a single transaction', async () => {
      mockTemplateRepo.find.mockResolvedValue([
        { id: 'tmpl-1', selectedActivities: [{ id: 'a-1' }] },
      ]);
      mockPermissionRepo.create.mockImplementation(data => data);
      mockManager.save.mockResolvedValue([]);

      await service.syncOccupationToAllTemplates('occ-1', [
        { careActivityId: 'a-1', permission: 'Y' },
      ]);

      // A partial failure must not leave the occupation with no permissions.
      expect(mockTemplateRepo.manager.transaction).toHaveBeenCalledTimes(1);
      expect(mockManager.delete).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalled();
    });

    it('should chunk the re-insert so a large rebuild stays under the parameter limit', async () => {
      const activityCount = MAX_TEMPLATE_CHANGE_ITEMS + 400;
      const activities = Array.from({ length: activityCount }, (_value, index) => ({
        id: `a-${index}`,
      }));
      mockTemplateRepo.find.mockResolvedValue([{ id: 'tmpl-1', selectedActivities: activities }]);
      mockPermissionRepo.create.mockImplementation(data => data);
      mockManager.save.mockResolvedValue([]);

      await service.syncOccupationToAllTemplates(
        'occ-1',
        activities.map(activity => ({ careActivityId: activity.id, permission: 'Y' })),
      );

      const batches = mockManager.save.mock.calls.map(([, batch]) => batch as unknown[]);
      expect(batches.length).toBeGreaterThan(1);
      // 6 bind parameters per row once limit columns are written explicitly.
      for (const batch of batches) {
        expect(batch.length * 6).toBeLessThanOrEqual(65535);
      }
      expect(batches.reduce((total, batch) => total + batch.length, 0)).toBe(activityCount);
    });
  });

  // ─── syncBulkUploadToTemplates ────────────────────────────────────
  describe('syncBulkUploadToTemplates', () => {
    it('clears limits only when an upload moves a row away from LC', async () => {
      mockManager.query.mockResolvedValue([]);

      await service.syncBulkUploadToTemplates(
        mockManager as any,
        new Map([['unit-1', 'tmpl-1']]),
        [],
        new Map(),
        new Map(),
        [
          {
            unit: { id: 'unit-1' },
            careActivity: { id: 'activity-1' },
            occupation: { id: 'occ-1' },
            permission: Permissions.PERFORM,
          } as any,
        ],
        [],
      );

      const [sql] = mockManager.query.mock.calls.find(([statement]) =>
        String(statement).includes('ON CONFLICT ON CONSTRAINT'),
      ) as [string, unknown];

      // Stale limits are cleared for non-LC rows, but a row that stays LC keeps
      // its curated values rather than becoming a limit-less LC row. Assert the
      // THEN branch specifically: an inverted CASE would satisfy a bare
      // "contains CASE" check while reintroducing the defect.
      expect(sql).toMatch(
        /limit_condition_id = CASE WHEN EXCLUDED\.permission = 'LC'\s+THEN care_setting_template_permission\.limit_condition_id END/,
      );
      expect(sql).toMatch(
        /restriction_description = CASE WHEN EXCLUDED\.permission = 'LC'\s+THEN care_setting_template_permission\.restriction_description END/,
      );
      expect(sql).not.toMatch(/THEN NULL/);
    });
  });

  // ─── removeOccupationFromAllTemplates ─────────────────────────────
  describe('removeOccupationFromAllTemplates', () => {
    it('should delete all permissions for the occupation', async () => {
      mockPermissionRepo.delete.mockResolvedValue({});

      await service.removeOccupationFromAllTemplates('occ-1');

      expect(mockPermissionRepo.delete).toHaveBeenCalledWith({ occupation: { id: 'occ-1' } });
    });
  });
  // ─── Template levels (feature 002, US1) ──────────────────────────
  describe('findTemplates - level filter', () => {
    beforeEach(() => {
      mockTemplateQB.getManyAndCount.mockResolvedValue([[], 0]);
    });

    const whereClauses = () => mockTemplateQB.andWhere.mock.calls.map(c => c[0]);

    it('adds no level predicate for ALL', async () => {
      await service.findTemplates({ level: TemplateLevelFilter.ALL } as any, null);

      expect(whereClauses().some((c: string) => c.includes('t.level'))).toBe(false);
      expect(whereClauses().some((c: string) => c.includes('isMaster'))).toBe(false);
    });

    it('adds no level predicate when the filter is omitted entirely', async () => {
      await service.findTemplates({} as any, null);

      expect(whereClauses().some((c: string) => c.includes('t.level'))).toBe(false);
    });

    // The filter narrows the list page's existing query rather than fetching a
    // level per row, so adding it costs one predicate no matter how many
    // templates come back.
    it('narrows the existing query rather than issuing a query per row', async () => {
      await service.findTemplates({ level: TemplateLevelFilter.SITE } as any, null);

      expect(mockTemplateQB.getManyAndCount).toHaveBeenCalledTimes(1);
      expect(whereClauses()).toContain('t.level = :level');
    });

    it('matches provincial on isMaster, because it is never a stored level', async () => {
      await service.findTemplates({ level: TemplateLevelFilter.PROVINCIAL } as any, null);

      expect(whereClauses()).toContain('t.isMaster = true');
      expect(whereClauses().some((c: string) => c.includes('t.level'))).toBe(false);
    });

    it('matches health authority on the stored level and excludes masters', async () => {
      await service.findTemplates({ level: TemplateLevelFilter.HEALTH_AUTHORITY } as any, null);

      expect(whereClauses()).toContain('t.isMaster = false');
      expect(mockTemplateQB.andWhere).toHaveBeenCalledWith('t.level = :level', {
        level: TemplateLevel.HEALTH_AUTHORITY,
      });
    });

    it('matches site on the stored level and excludes masters', async () => {
      await service.findTemplates({ level: TemplateLevelFilter.SITE } as any, null);

      expect(whereClauses()).toContain('t.isMaster = false');
      expect(mockTemplateQB.andWhere).toHaveBeenCalledWith('t.level = :level', {
        level: TemplateLevel.SITE,
      });
    });

    it('composes the level filter with the search text rather than replacing it', async () => {
      await service.findTemplates(
        { searchText: 'Emergency', level: TemplateLevelFilter.SITE } as any,
        null,
      );

      expect(mockTemplateQB.andWhere).toHaveBeenCalledWith('t.name ILIKE :name', {
        name: '%Emergency%',
      });
      expect(whereClauses()).toContain('t.isMaster = false');
    });

    it('sorts masters into the provincial tier when sorting by level', async () => {
      await service.findTemplates(
        { sortBy: CareSettingsCMSFindSortKeys.LEVEL, sortOrder: SortOrder.ASC } as any,
        null,
      );

      expect(mockTemplateQB.addSelect).toHaveBeenCalledWith(expect.any(String), 'level_rank');
      expect(mockTemplateQB.addOrderBy).toHaveBeenCalledWith('level_rank', SortOrder.ASC);
    });

    it('filters by level as one predicate on the existing query, not a per-row lookup', async () => {
      await service.findTemplates({ level: TemplateLevelFilter.SITE } as any, null);

      // A single getManyAndCount for the page - no N+1
      expect(mockTemplateQB.getManyAndCount).toHaveBeenCalledTimes(1);
    });
  });

  describe('copy level derivation', () => {
    beforeEach(() => {
      mockTemplateQB.getOne.mockResolvedValue(null);
      mockTemplateRepo.create.mockImplementation((data: any) => data);
      mockTemplateRepo.save.mockImplementation(async (data: any) => ({ ...data, id: 'new-1' }));
      mockBundleRepo.find.mockResolvedValue([]);
      mockCareActivityRepo.find.mockResolvedValue([]);
    });

    it('gives a copy of a master the health authority level', async () => {
      mockTemplateRepo.findOne
        .mockResolvedValueOnce({ ...mockTemplate, isMaster: true, permissions: [] })
        .mockResolvedValueOnce({ ...mockTemplate });

      await service.copyTemplate('src', { name: 'Copy' } as any, 'Fraser Health');

      expect(mockTemplateRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ level: TemplateLevel.HEALTH_AUTHORITY }),
      );
    });

    it('gives a copy of a non-master the site level', async () => {
      mockTemplateRepo.findOne
        .mockResolvedValueOnce({ ...mockTemplate, isMaster: false, permissions: [] })
        .mockResolvedValueOnce({ ...mockTemplate });

      await service.copyTemplate('src', { name: 'Copy' } as any, 'Fraser Health');

      expect(mockTemplateRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ level: TemplateLevel.SITE }),
      );
    });

    it('honours an explicitly chosen level over the derivation', async () => {
      mockTemplateRepo.findOne
        .mockResolvedValueOnce({ ...mockTemplate, isMaster: true, permissions: [] })
        .mockResolvedValueOnce({ ...mockTemplate });

      await service.copyTemplate(
        'src',
        { name: 'Copy', level: TemplateLevel.SITE } as any,
        'Fraser Health',
      );

      expect(mockTemplateRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ level: TemplateLevel.SITE }),
      );
    });
  });

  // SC-001: the backfill rule, asserted rather than left to manual SQL
  describe('backfill rule (SC-001)', () => {
    const deriveLevel = (t: { isMaster: boolean; parentIsMaster?: boolean }) =>
      t.isMaster ? null : t.parentIsMaster ? TemplateLevel.HEALTH_AUTHORITY : TemplateLevel.SITE;

    const fixture = [
      { name: 'ED - Master', isMaster: true },
      { name: 'ED - Fraser', isMaster: false, parentIsMaster: true },
      { name: 'ED - Fraser Site A', isMaster: false, parentIsMaster: false },
      { name: 'Orphan', isMaster: false, parentIsMaster: false },
    ];

    it('leaves masters unlevelled, levels master-children as health authority, everything else as site', () => {
      const levels = fixture.map(deriveLevel);

      expect(levels).toEqual([
        null,
        TemplateLevel.HEALTH_AUTHORITY,
        TemplateLevel.SITE,
        TemplateLevel.SITE,
      ]);
      expect(levels.filter(l => l === null)).toHaveLength(1);
      expect(levels.every((l, i) => (fixture[i].isMaster ? l === null : l !== null))).toBe(true);
    });
  });

  // ─── Limits and conditions (feature 002, US3) ────────────────────
  describe('updateTemplate - limits and conditions', () => {
    const lcPermission = (over: any = {}) => ({
      activityId: 'activity-1',
      occupationId: 'occ-1',
      permission: Permissions.LIMITS,
      ...over,
    });

    const baseDto = (permissions: any[]) => ({
      selectedBundleIds: [],
      selectedActivityIds: [],
      permissions,
    });

    beforeEach(() => {
      mockTemplateQB.getOne.mockResolvedValue(null);
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockBundleRepo.find.mockResolvedValue([]);
      mockCareActivityRepo.find.mockResolvedValue([mockActivity]);
      mockOccupationRepo.find.mockResolvedValue([mockOccupation]);
    });

    // Contract case 9
    it('rejects a newly set LC permission that carries no limit', async () => {
      await expect(
        service.updateTemplate('tmpl-1', baseDto([lcPermission()]) as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects before targeted permission writes, so a bad payload leaves stored permissions intact', async () => {
      await expect(
        service.updateTemplate('tmpl-1', baseDto([lcPermission()]) as any),
      ).rejects.toThrow(BadRequestException);

      expect(mockManager.delete).not.toHaveBeenCalled();
      expect(
        mockManager.query.mock.calls.some(
          ([sql]) =>
            String(sql).includes('ON CONFLICT ON CONSTRAINT template_activity_occupation') ||
            String(sql).startsWith('DELETE FROM care_setting_template_permission'),
        ),
      ).toBe(false);
    });

    // Contract case 9a - legacy LC exemption
    it('accepts an unchanged legacy LC cell without a limit in a compatible full-grid save', async () => {
      mockManager.query.mockImplementation(async sql => {
        if (String(sql).includes('version = version + 1')) return [[{ version: 4 }], 1];
        if (String(sql).includes('SELECT care_activity_id')) {
          return [
            {
              care_activity_id: 'activity-1',
              occupation_id: 'occ-1',
              permission: Permissions.LIMITS,
              limit_condition_id: null,
              restriction_description: null,
            },
          ];
        }
        return [];
      });

      await expect(
        service.updateTemplate('tmpl-1', baseDto([lcPermission()]) as any),
      ).resolves.toBeUndefined();

      expect(mockManager.save).toHaveBeenCalled();
    });

    it('still rejects a different cell newly set to LC even when a legacy cell exists', async () => {
      mockManager.query.mockImplementation(async sql => {
        if (String(sql).includes('version = version + 1')) return [[{ version: 4 }], 1];
        if (String(sql).includes('SELECT care_activity_id')) {
          return [
            {
              care_activity_id: 'other-activity',
              occupation_id: 'other-occ',
              permission: Permissions.LIMITS,
              limit_condition_id: null,
              restriction_description: null,
            },
          ];
        }
        return [];
      });

      await expect(
        service.updateTemplate('tmpl-1', baseDto([lcPermission()]) as any),
      ).rejects.toThrow(BadRequestException);
    });

    // Contract case 10
    it('rejects a limit id that is not in the catalogue', async () => {
      mockLimitConditionRepo.find.mockResolvedValue([]);

      await expect(
        service.updateTemplate('tmpl-1', baseDto([lcPermission({ limitId: 'ghost' })]) as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('writes the selected limit and description for a valid LC permission', async () => {
      mockLimitConditionRepo.find.mockResolvedValue([{ id: 'limit-1', name: 'Supervision' }]);

      await service.updateTemplate(
        'tmpl-1',
        baseDto([
          lcPermission({ limitId: 'limit-1', restrictionDescription: '  Only overnight.  ' }),
        ]) as any,
      );

      expect(mockManager.query).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT ON CONSTRAINT template_activity_occupation'),
        expect.arrayContaining([
          'tmpl-1',
          'activity-1',
          'occ-1',
          Permissions.LIMITS,
          'limit-1',
          'Only overnight.',
        ]),
      );
    });

    // Contract case 11 - leaving LC discards the limit
    it.each([Permissions.PERFORM, Permissions.NO])(
      'clears the limit and description when a permission moves to %s',
      async permission => {
        mockLimitConditionRepo.find.mockResolvedValue([{ id: 'limit-1', name: 'Supervision' }]);

        await service.updateTemplate(
          'tmpl-1',
          baseDto([
            lcPermission({
              permission,
              limitId: 'limit-1',
              restrictionDescription: 'stale text',
            }),
          ]) as any,
        );

        if (permission === Permissions.NO) {
          expect(mockManager.query).not.toHaveBeenCalledWith(
            expect.stringContaining('ON CONFLICT ON CONSTRAINT template_activity_occupation'),
            expect.anything(),
          );
          return;
        }

        expect(mockManager.query).toHaveBeenCalledWith(
          expect.stringContaining('ON CONFLICT ON CONSTRAINT template_activity_occupation'),
          expect.arrayContaining([
            'tmpl-1',
            'activity-1',
            'occ-1',
            Permissions.PERFORM,
            null,
            null,
          ]),
        );
      },
    );

    it('ignores a limit the client sent alongside a non-LC permission', async () => {
      await service.updateTemplate(
        'tmpl-1',
        baseDto([lcPermission({ permission: Permissions.PERFORM, limitId: 'limit-1' })]) as any,
      );

      // The catalogue is never consulted, because a non-LC limit is discarded
      expect(mockLimitConditionRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('getLimitConditions', () => {
    // Contract case 15
    it('returns only active entries, ordered by sortOrder then name', async () => {
      mockLimitConditionRepo.find.mockResolvedValue([
        { id: 'l1', name: 'Supervision', description: null },
      ]);

      const result = await service.getLimitConditions();

      expect(mockLimitConditionRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { sortOrder: 'ASC', name: 'ASC' },
      });
      expect(result).toEqual([{ id: 'l1', name: 'Supervision', description: null }]);
    });
  });

  describe('getParentPermissions', () => {
    // Contract case 13
    it('returns an empty baseline when the template has no parent', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate, parent: null });

      await expect(service.getParentPermissions('tmpl-1')).resolves.toEqual([]);
    });

    it('returns the parent permission triples without limits', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate, parent: { id: 'parent-1' } });
      mockPermissionQB.getRawMany.mockResolvedValue([
        { care_activity_id: 'a1', occupation_id: 'o1', permission: Permissions.LIMITS },
      ]);

      const result = await service.getParentPermissions('tmpl-1');

      expect(result).toEqual([
        { activityId: 'a1', occupationId: 'o1', permission: Permissions.LIMITS },
      ]);
      expect(result[0]).not.toHaveProperty('limitId');
    });

    it('throws when the template does not exist', async () => {
      mockTemplateRepo.findOne.mockResolvedValue(null);

      await expect(service.getParentPermissions('ghost')).rejects.toThrow(NotFoundException);
    });

    // The badge compares every cell in the grid against this baseline, so the
    // whole baseline has to arrive in one indexed read. A per-activity or
    // per-occupation query here would put hundreds of round trips behind a
    // single wizard step.
    it('fetches the whole baseline in a single query regardless of its size', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate, parent: { id: 'parent-1' } });
      mockPermissionQB.getRawMany.mockResolvedValue(
        Array.from({ length: 1500 }, (_, i) => ({
          care_activity_id: `a${i}`,
          occupation_id: `o${i}`,
          permission: Permissions.PERFORM,
        })),
      );

      const result = await service.getParentPermissions('tmpl-1');

      expect(result).toHaveLength(1500);
      expect(mockPermissionQB.getRawMany).toHaveBeenCalledTimes(1);
      expect(mockPermissionQB.where).toHaveBeenCalledWith('p.template_id = :templateId', {
        templateId: 'parent-1',
      });
    });
  });

  // ─── Optimistic concurrency (feature 002, US4) ───────────────────
  describe('updateTemplate - concurrency', () => {
    const dto = (over: any = {}) => ({
      selectedBundleIds: [],
      selectedActivityIds: [],
      permissions: [],
      ...over,
    });

    beforeEach(() => {
      mockTemplateQB.getOne.mockResolvedValue(null);
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockBundleRepo.find.mockResolvedValue([]);
      mockCareActivityRepo.find.mockResolvedValue([]);
    });

    // Contract case 16
    it('claims the row with a guarded update when the version matches', async () => {
      await service.updateTemplate('tmpl-1', dto({ expectedVersion: 3 }) as any);

      expect(mockManager.query).toHaveBeenCalledWith(
        expect.stringContaining('version = version + 1'),
        ['tmpl-1', 3],
      );
      expect(mockManager.save).toHaveBeenCalled();
    });

    // The entity save must not put the pre-guard version back, or the next
    // editor's stale token would still match.
    it('saves the version it just claimed rather than the stale one', async () => {
      mockManager.query.mockResolvedValue([[{ version: 4 }], 1]);

      await service.updateTemplate('tmpl-1', dto({ expectedVersion: 3 }) as any);

      expect(mockManager.save).toHaveBeenCalledWith(
        CareSettingTemplate,
        expect.objectContaining({ version: 4 }),
      );
    });

    it('guards on the version rather than on updatedAt', async () => {
      await service.updateTemplate('tmpl-1', dto({ expectedVersion: 3 }) as any);

      const sql = mockManager.query.mock.calls[0][0];
      expect(sql).toContain('version = $2');
      expect(sql).not.toContain('updated_at');
    });

    // Contract case 17
    it('rejects a stale version with a conflict carrying the current version', async () => {
      mockManager.query.mockResolvedValue([[], 0]);
      mockManager.findOne.mockResolvedValue({
        id: 'tmpl-1',
        version: 7,
        updatedAt: new Date('2026-09-02T10:00:00Z'),
        updatedBy: { displayName: 'Jane Admin' },
      });

      await expect(
        service.updateTemplate('tmpl-1', dto({ expectedVersion: 3 }) as any),
      ).rejects.toThrow(TemplateVersionConflictException);
    });

    it('writes nothing when the version guard rejects the save', async () => {
      mockManager.query.mockResolvedValue([[], 0]);
      mockManager.findOne.mockResolvedValue({ id: 'tmpl-1', version: 7 });

      await expect(
        service.updateTemplate('tmpl-1', dto({ expectedVersion: 3 }) as any),
      ).rejects.toThrow(TemplateVersionConflictException);

      // The guard runs before the destructive step, so nothing is deleted
      expect(mockManager.delete).not.toHaveBeenCalled();
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('names who saved last so the conflict can be explained to the user', async () => {
      mockManager.query.mockResolvedValue([[], 0]);
      mockManager.findOne.mockResolvedValue({
        id: 'tmpl-1',
        version: 7,
        updatedBy: { displayName: 'Jane Admin' },
      });

      await service
        .updateTemplate('tmpl-1', dto({ expectedVersion: 3 }) as any)
        .catch((e: TemplateVersionConflictException) => {
          const body = e.getResponse() as any;
          expect(body.data.currentVersion).toBe(7);
          expect(body.data.updatedBy).toBe('Jane Admin');
        });

      expect.hasAssertions();
    });

    // Contract case 18 - existing callers keep working
    it('still saves when no expectedVersion is supplied', async () => {
      await service.updateTemplate('tmpl-1', dto() as any);

      expect(mockManager.query).toHaveBeenCalledWith(expect.stringContaining('WHERE id = $1'), [
        'tmpl-1',
      ]);
      expect(mockManager.save).toHaveBeenCalled();
    });

    // The guard reads `UPDATE ... RETURNING version` through the raw driver,
    // whose result shape differs between drivers and TypeORM settings. Every
    // shape has to yield the same claimed version, or a successful claim would
    // be misread as a conflict.
    it.each([
      ['[rows, affectedCount]', [[{ version: 4 }], 1]],
      ['a flat rows array', [{ version: 4 }]],
      ['a QueryResult with rows', { rows: [{ version: 4 }], rowCount: 1 }],
      ['a QueryResult with records', { records: [{ version: 4 }] }],
      ['a single row object', { version: 4 }],
    ])('reads the claimed version from %s', async (_shape, result) => {
      mockManager.query.mockResolvedValue(result);

      await service.updateTemplate('tmpl-1', dto({ expectedVersion: 3 }) as any);

      expect(mockManager.save).toHaveBeenCalledWith(
        CareSettingTemplate,
        expect.objectContaining({ version: 4 }),
      );
    });

    // "No row matched" is the conflict signal, whichever way the driver spells
    // an empty result.
    it.each([
      ['[rows, affectedCount]', [[], 0]],
      ['a flat empty array', []],
      ['a QueryResult with rows', { rows: [], rowCount: 0 }],
      ['a QueryResult with records', { records: [] }],
    ])('treats %s with no row as a conflict', async (_shape, result) => {
      mockManager.query.mockResolvedValue(result);
      mockManager.findOne.mockResolvedValue({ id: 'tmpl-1', version: 7 });

      await expect(
        service.updateTemplate('tmpl-1', dto({ expectedVersion: 3 }) as any),
      ).rejects.toThrow(TemplateVersionConflictException);

      expect(mockManager.save).not.toHaveBeenCalled();
    });

    // Contract case 19 - the whole save is one transaction
    it('performs the delete and recreate inside a single transaction', async () => {
      await service.updateTemplate('tmpl-1', dto({ expectedVersion: 0 }) as any);

      expect(mockTemplateRepo.manager.transaction).toHaveBeenCalledTimes(1);
    });

    it('propagates a mid-save failure so the transaction rolls back', async () => {
      mockManager.save.mockRejectedValueOnce(new Error('db exploded'));

      await expect(
        service.updateTemplate('tmpl-1', dto({ expectedVersion: 0 }) as any),
      ).rejects.toThrow('db exploded');
    });
  });

  describe('updateTemplateDetails', () => {
    const detailsDto = (over: any = {}) => ({
      name: 'Renamed',
      level: TemplateLevel.SITE,
      expectedVersion: 2,
      ...over,
    });

    beforeEach(() => {
      mockTemplateQB.getOne.mockResolvedValue(null);
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
    });

    it('saves the new name and level', async () => {
      await service.updateTemplateDetails('tmpl-1', detailsDto() as any);

      expect(mockManager.save).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ name: 'Renamed', level: TemplateLevel.SITE }),
      );
    });

    it('advances the stored version so the next stale save is rejected', async () => {
      mockManager.query.mockResolvedValue([[{ version: 9 }], 1]);

      await service.updateTemplateDetails('tmpl-1', detailsDto() as any);

      expect(mockManager.save).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ version: 9 }),
      );
    });

    // FR-012a - reclassifying must not disturb ancestry
    it('never touches the parent link when the level changes', async () => {
      await service.updateTemplateDetails('tmpl-1', detailsDto() as any);

      const saved = mockManager.save.mock.calls[0][1];
      expect(saved.parent).toBe(mockParent);
    });

    it('rejects editing a master template', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate, isMaster: true });

      await expect(service.updateTemplateDetails('tmpl-1', detailsDto() as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects a cross-health-authority edit', async () => {
      await expect(
        service.updateTemplateDetails('tmpl-1', detailsDto() as any, 'Interior Health'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects a duplicate name within the health authority', async () => {
      mockTemplateQB.getOne.mockResolvedValue({ id: 'other' });

      await expect(service.updateTemplateDetails('tmpl-1', detailsDto() as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('skips the duplicate check when the name is unchanged', async () => {
      await service.updateTemplateDetails('tmpl-1', detailsDto({ name: 'Test Template' }) as any);

      expect(mockTemplateQB.getOne).not.toHaveBeenCalled();
    });

    // Contract case 22
    it('rejects a stale version and leaves name and level unchanged', async () => {
      mockManager.query.mockResolvedValue([[], 0]);
      mockManager.findOne.mockResolvedValue({ id: 'tmpl-1', version: 9 });

      await expect(service.updateTemplateDetails('tmpl-1', detailsDto() as any)).rejects.toThrow(
        TemplateVersionConflictException,
      );
      expect(mockManager.save).not.toHaveBeenCalled();
    });
  });
});
