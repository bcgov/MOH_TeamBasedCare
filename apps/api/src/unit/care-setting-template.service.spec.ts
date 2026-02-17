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
import { CareSettingsCMSFindSortKeys, SortOrder } from '@tbcm/common';

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
    },
  };

  const mockPermissionRepo = {
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockUnitRepo = { find: jest.fn() };
  const mockBundleRepo = { find: jest.fn(), createQueryBuilder: jest.fn() };
  const mockCareActivityRepo = { find: jest.fn() };
  const mockOccupationRepo = { find: jest.fn() };

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

    mockTemplateQB = createMockQueryBuilder();
    mockPermissionQB = createMockQueryBuilder();
    mockBundleQB = createMockQueryBuilder();
    mockManagerQB = createMockQueryBuilder();

    mockTemplateRepo.createQueryBuilder.mockReturnValue(mockTemplateQB);
    mockPermissionRepo.createQueryBuilder.mockReturnValue(mockPermissionQB);
    mockBundleRepo.createQueryBuilder.mockReturnValue(mockBundleQB);
    mockTemplateRepo.manager.createQueryBuilder.mockReturnValue(mockManagerQB);

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

    it('should default sort by isMaster DESC then name ASC', async () => {
      await service.findTemplates({ page: 1, pageSize: 10 } as any, null);

      expect(mockTemplateQB.orderBy).toHaveBeenCalledWith('t.isMaster', 'DESC');
      expect(mockTemplateQB.addOrderBy).toHaveBeenCalledWith('t.name', 'ASC');
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
        { activityId: 'a-1', occupationId: 'o-1', permission: 'Y' },
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
    });

    it('should create copy with custom data', async () => {
      mockTemplateRepo.findOne
        .mockResolvedValueOnce(mockTemplate)
        .mockResolvedValueOnce({ ...mockTemplate, id: 'new-1' });
      mockTemplateRepo.create.mockReturnValue({ id: 'new-1' });
      mockTemplateRepo.save.mockResolvedValue({ id: 'new-1' });
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
      mockTemplateRepo.save.mockResolvedValue({ id: 'new-1' });
      mockBundleRepo.find.mockResolvedValue([mockBundle]);
      mockCareActivityRepo.find
        .mockResolvedValueOnce([mockActivity]) // selectedActivities
        .mockResolvedValueOnce([mockActivity]); // permissions activities
      mockOccupationRepo.find.mockResolvedValue([mockOccupation]);
      mockPermissionRepo.create.mockReturnValue({});
      mockPermissionRepo.save.mockResolvedValue([]);

      const dto = {
        name: 'Copy',
        selectedBundleIds: ['bundle-1'],
        selectedActivityIds: ['activity-1'],
        permissions: [{ activityId: 'activity-1', occupationId: 'occ-1', permission: 'Y' }],
      };

      await service.copyTemplateWithData('tmpl-1', dto as any, 'Fraser Health');

      expect(mockPermissionRepo.create).toHaveBeenCalled();
      expect(mockPermissionRepo.save).toHaveBeenCalled();
    });

    it('should skip invalid permissions where activity/occupation not found', async () => {
      mockTemplateRepo.findOne
        .mockResolvedValueOnce(mockTemplate)
        .mockResolvedValueOnce({ ...mockTemplate, id: 'new-1' });
      mockTemplateRepo.create.mockReturnValue({ id: 'new-1' });
      mockTemplateRepo.save.mockResolvedValue({ id: 'new-1' });
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
      expect(mockPermissionRepo.create).not.toHaveBeenCalled();
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

      expect(mockTemplateRepo.save).toHaveBeenCalled();
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
      } as any);

      // checkDuplicateName should NOT have been called (name didn't change)
      expect(mockTemplateQB.getOne).not.toHaveBeenCalled();
    });

    it('should delete and recreate permissions', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockTemplateRepo.save.mockResolvedValue(mockTemplate);
      mockBundleRepo.find.mockResolvedValue([]);
      mockCareActivityRepo.find
        .mockResolvedValueOnce([]) // selectedActivities
        .mockResolvedValueOnce([mockActivity]); // permissions activities
      mockOccupationRepo.find.mockResolvedValue([mockOccupation]);
      mockPermissionRepo.delete.mockResolvedValue({});
      mockPermissionRepo.create.mockReturnValue({});
      mockPermissionRepo.save.mockResolvedValue([]);

      await service.updateTemplate('tmpl-1', {
        selectedBundleIds: [],
        selectedActivityIds: [],
        permissions: [{ activityId: 'activity-1', occupationId: 'occ-1', permission: 'Y' }],
      } as any);

      expect(mockPermissionRepo.delete).toHaveBeenCalledWith({ template: { id: 'tmpl-1' } });
      expect(mockPermissionRepo.create).toHaveBeenCalled();
    });

    it('should skip permissions recreation when empty', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockTemplateRepo.save.mockResolvedValue(mockTemplate);
      mockBundleRepo.find.mockResolvedValue([]);
      mockCareActivityRepo.find.mockResolvedValue([]);
      mockPermissionRepo.delete.mockResolvedValue({});

      await service.updateTemplate('tmpl-1', {
        selectedBundleIds: [],
        selectedActivityIds: [],
        permissions: [],
      } as any);

      expect(mockPermissionRepo.delete).toHaveBeenCalled();
      // save should not be called for permissions since array is empty
      expect(mockPermissionRepo.save).not.toHaveBeenCalled();
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

    it('should throw BadRequestException when draft sessions reference template', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockManagerQB.getRawOne.mockResolvedValue({ count: '3' });

      await expect(service.deleteTemplate('tmpl-1')).rejects.toThrow(BadRequestException);
    });

    it('should allow deletion when no draft sessions reference template', async () => {
      mockTemplateRepo.findOne.mockResolvedValue({ ...mockTemplate });
      mockManagerQB.getRawOne.mockResolvedValue({ count: '0' });
      mockPermissionRepo.delete.mockResolvedValue({});
      mockTemplateRepo.delete.mockResolvedValue({});

      await expect(service.deleteTemplate('tmpl-1')).resolves.not.toThrow();
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
      mockPermissionRepo.save.mockResolvedValue([]);

      const permissions = [
        { careActivityId: 'a-1', permission: 'Y' },
        { careActivityId: 'a-2', permission: 'LC' },
      ];

      await service.syncOccupationToAllTemplates('occ-1', permissions);

      // Should delete all existing permissions for this occupation
      expect(mockPermissionRepo.delete).toHaveBeenCalledWith({ occupation: { id: 'occ-1' } });

      // Should load all templates with selectedActivities
      expect(mockTemplateRepo.find).toHaveBeenCalledWith({
        relations: ['selectedActivities'],
      });

      // Should create permissions:
      // - tmpl-1: a-1(Y), a-2(LC) - both activities are in template
      // - tmpl-2: a-1(Y) only - a-2 is not in this template, a-3 has no permission
      expect(mockPermissionRepo.save).toHaveBeenCalled();
      const savedPermissions = mockPermissionRepo.save.mock.calls[0][0];
      expect(savedPermissions).toHaveLength(3); // 2 for tmpl-1, 1 for tmpl-2
    });

    it('should only delete permissions when permissions array is empty', async () => {
      mockPermissionRepo.delete.mockResolvedValue({});

      await service.syncOccupationToAllTemplates('occ-1', []);

      expect(mockPermissionRepo.delete).toHaveBeenCalledWith({ occupation: { id: 'occ-1' } });
      expect(mockTemplateRepo.find).not.toHaveBeenCalled();
      expect(mockPermissionRepo.save).not.toHaveBeenCalled();
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
      mockPermissionRepo.save.mockResolvedValue([]);

      const permissions = [
        { careActivityId: 'a-1', permission: 'Y' },
        { careActivityId: 'a-2', permission: 'N' }, // This should be filtered out
      ];

      await service.syncOccupationToAllTemplates('occ-1', permissions);

      const savedPermissions = mockPermissionRepo.save.mock.calls[0][0];
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

      expect(mockPermissionRepo.save).not.toHaveBeenCalled();
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
});
