import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { KpiService } from './kpi.service';
import { User } from 'src/user/entities/user.entity';
import { PlanningSession } from 'src/planning-session/entity/planning-session.entity';
import { CareSettingTemplate } from 'src/unit/entity/care-setting-template.entity';
import { GeneralKPIsRO, CarePlansBySettingRO, KPIsOverviewRO, KPICareSettingRO, Role } from '@tbcm/common';

describe('KpiService', () => {
  let service: KpiService;

  // Mock query builder with chainable methods
  const createMockQueryBuilder = () => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  });

  let mockUserQueryBuilder: ReturnType<typeof createMockQueryBuilder>;
  let mockPlanningSessionQueryBuilder: ReturnType<typeof createMockQueryBuilder>;
  let mockTemplateQueryBuilder: ReturnType<typeof createMockQueryBuilder>;

  const mockUserRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockPlanningSessionRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockTemplateRepo = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockUserQueryBuilder = createMockQueryBuilder();
    mockPlanningSessionQueryBuilder = createMockQueryBuilder();
    mockTemplateQueryBuilder = createMockQueryBuilder();

    mockUserRepo.createQueryBuilder.mockReturnValue(mockUserQueryBuilder);
    mockPlanningSessionRepo.createQueryBuilder.mockReturnValue(mockPlanningSessionQueryBuilder);
    mockTemplateRepo.createQueryBuilder.mockReturnValue(mockTemplateQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KpiService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(PlanningSession),
          useValue: mockPlanningSessionRepo,
        },
        {
          provide: getRepositoryToken(CareSettingTemplate),
          useValue: mockTemplateRepo,
        },
      ],
    }).compile();

    service = module.get<KpiService>(KpiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEffectiveHealthAuthority', () => {
    it('should return null for admin users', () => {
      const result = service.getEffectiveHealthAuthority({
        roles: [Role.ADMIN],
        organization: 'Fraser Health',
      });
      expect(result).toBeNull();
    });

    it('should return organization for content admin', () => {
      const result = service.getEffectiveHealthAuthority({
        roles: [Role.CONTENT_ADMIN],
        organization: 'Interior Health',
      });
      expect(result).toBe('Interior Health');
    });

    it('should return empty string when content admin has no organization', () => {
      const result = service.getEffectiveHealthAuthority({
        roles: [Role.CONTENT_ADMIN],
      });
      expect(result).toBe('');
    });

    it('should return null when user has both admin and content admin roles', () => {
      const result = service.getEffectiveHealthAuthority({
        roles: [Role.ADMIN, Role.CONTENT_ADMIN],
        organization: 'Fraser Health',
      });
      expect(result).toBeNull();
    });
  });

  describe('getGeneralKPIs', () => {
    beforeEach(() => {
      // Default: getCount returns values for both user queries and planning session query
      mockUserQueryBuilder.getCount
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(50); // activeUsers
      mockPlanningSessionQueryBuilder.getCount.mockResolvedValue(200);
    });

    it('should return total users, active users, and care plans', async () => {
      const result = await service.getGeneralKPIs();

      expect(result).toBeInstanceOf(GeneralKPIsRO);
      expect(result.totalUsers).toBe(100);
      expect(result.activeUsers).toBe(50);
      expect(result.totalCarePlans).toBe(200);
    });

    it('should filter users by health authority when provided', async () => {
      await service.getGeneralKPIs('Fraser Health');

      // Both user queries should filter by HA
      expect(mockUserQueryBuilder.andWhere).toHaveBeenCalledWith(
        'u.organization = :healthAuthority',
        { healthAuthority: 'Fraser Health' },
      );
    });

    it('should filter care plans by template HA when provided', async () => {
      await service.getGeneralKPIs('Fraser Health');

      expect(mockPlanningSessionQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'ps.careSettingTemplate',
        'cst',
      );
      expect(mockPlanningSessionQueryBuilder.where).toHaveBeenCalledWith(
        'cst.healthAuthority IN (:...authorities)',
        { authorities: ['Fraser Health', 'GLOBAL'] },
      );
    });

    it('should still join template when no HA provided (for consistency)', async () => {
      await service.getGeneralKPIs();

      expect(mockPlanningSessionQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'ps.careSettingTemplate',
        'cst',
      );
      expect(mockPlanningSessionQueryBuilder.where).not.toHaveBeenCalled();
    });

    it('should handle zero counts', async () => {
      mockUserQueryBuilder.getCount.mockReset();
      mockUserQueryBuilder.getCount.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
      mockPlanningSessionQueryBuilder.getCount.mockResolvedValue(0);

      const result = await service.getGeneralKPIs();

      expect(result.totalUsers).toBe(0);
      expect(result.activeUsers).toBe(0);
      expect(result.totalCarePlans).toBe(0);
    });

    it('should set startOfMonth to first day of current month at midnight', async () => {
      await service.getGeneralKPIs();

      // calls[0] is revokedAt IS NULL (totalUsers), calls[1] is lastLoginAt (activeUsers)
      const passedDate = mockUserQueryBuilder.where.mock.calls[1][1].startOfMonth;
      expect(passedDate.getDate()).toBe(1);
      expect(passedDate.getHours()).toBe(0);
      expect(passedDate.getMinutes()).toBe(0);
      expect(passedDate.getSeconds()).toBe(0);
    });

    it('should propagate repository errors', async () => {
      mockUserQueryBuilder.getCount.mockReset();
      mockUserQueryBuilder.getCount.mockRejectedValue(new Error('DB connection lost'));

      await expect(service.getGeneralKPIs()).rejects.toThrow('DB connection lost');
    });
  });

  describe('getCarePlansBySetting', () => {
    const mockRawResults = [
      {
        careSettingId: 'tmpl-1',
        careSettingName: 'ACUTE Care',
        healthAuthority: 'Fraser Health',
        count: '10',
      },
      {
        careSettingId: 'tmpl-2',
        careSettingName: 'Emergency',
        healthAuthority: 'Vancouver Coastal Health',
        count: '5',
      },
    ];

    it('should return grouped data without filters', async () => {
      mockPlanningSessionQueryBuilder.getRawMany.mockResolvedValue(mockRawResults);

      const result = await service.getCarePlansBySetting({});

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(CarePlansBySettingRO);
      expect(result[0].careSettingId).toBe('tmpl-1');
      expect(result[0].careSettingName).toBe('ACUTE Care');
      expect(result[0].healthAuthority).toBe('Fraser Health');
      expect(result[0].count).toBe(10);

      // Verify joins use template, not unit directly
      expect(mockPlanningSessionQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'ps.careSettingTemplate',
        'cst',
      );
      expect(mockPlanningSessionQueryBuilder.innerJoin).toHaveBeenCalledWith('cst.unit', 'u');
      expect(mockPlanningSessionQueryBuilder.groupBy).toHaveBeenCalledWith('cst.id');
    });

    it('should filter by health authority using template HA', async () => {
      mockPlanningSessionQueryBuilder.getRawMany.mockResolvedValue([mockRawResults[0]]);

      await service.getCarePlansBySetting({ healthAuthority: 'Fraser Health' });

      expect(mockPlanningSessionQueryBuilder.andWhere).toHaveBeenCalledWith(
        'cst.healthAuthority IN (:...authorities)',
        { authorities: ['Fraser Health', 'GLOBAL'] },
      );
    });

    it('should filter by care setting (template ID)', async () => {
      mockPlanningSessionQueryBuilder.getRawMany.mockResolvedValue([mockRawResults[0]]);

      await service.getCarePlansBySetting({ careSettingId: 'tmpl-1' });

      expect(mockPlanningSessionQueryBuilder.andWhere).toHaveBeenCalledWith(
        'cst.id = :careSettingId',
        { careSettingId: 'tmpl-1' },
      );
    });

    it('should apply both filters', async () => {
      mockPlanningSessionQueryBuilder.getRawMany.mockResolvedValue([mockRawResults[0]]);

      await service.getCarePlansBySetting({
        healthAuthority: 'Fraser Health',
        careSettingId: 'tmpl-1',
      });

      expect(mockPlanningSessionQueryBuilder.andWhere).toHaveBeenCalledWith(
        'cst.healthAuthority IN (:...authorities)',
        { authorities: ['Fraser Health', 'GLOBAL'] },
      );
      expect(mockPlanningSessionQueryBuilder.andWhere).toHaveBeenCalledWith(
        'cst.id = :careSettingId',
        { careSettingId: 'tmpl-1' },
      );
    });

    it('should return empty array when no results', async () => {
      mockPlanningSessionQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.getCarePlansBySetting({});

      expect(result).toEqual([]);
    });

    it('should map null healthAuthority to Unknown', async () => {
      mockPlanningSessionQueryBuilder.getRawMany.mockResolvedValue([
        {
          careSettingId: 'tmpl-1',
          careSettingName: 'ACUTE Care',
          healthAuthority: null,
          count: '10',
        },
      ]);

      const result = await service.getCarePlansBySetting({});

      expect(result[0].healthAuthority).toBe('Unknown');
    });

    it('should map GLOBAL healthAuthority to Master', async () => {
      mockPlanningSessionQueryBuilder.getRawMany.mockResolvedValue([
        {
          careSettingId: 'tmpl-1',
          careSettingName: 'ACUTE Care',
          healthAuthority: 'GLOBAL',
          count: '3',
        },
      ]);

      const result = await service.getCarePlansBySetting({});

      expect(result[0].healthAuthority).toBe('Master');
    });

    it('should not apply healthAuthority filter when undefined', async () => {
      mockPlanningSessionQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.getCarePlansBySetting({ careSettingId: 'tmpl-1' });

      const andWhereCalls = mockPlanningSessionQueryBuilder.andWhere.mock.calls;
      const haFilterCalls = andWhereCalls.filter(
        (call: any[]) => typeof call[0] === 'string' && call[0].includes('healthAuthority'),
      );
      expect(haFilterCalls).toHaveLength(0);
    });

    it('should not apply careSettingId filter when undefined', async () => {
      mockPlanningSessionQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.getCarePlansBySetting({ healthAuthority: 'Fraser Health' });

      const andWhereCalls = mockPlanningSessionQueryBuilder.andWhere.mock.calls;
      const csFilterCalls = andWhereCalls.filter(
        (call: any[]) => typeof call[0] === 'string' && call[0].includes('careSettingId'),
      );
      expect(csFilterCalls).toHaveLength(0);
    });

    it('should parse count as integer', async () => {
      mockPlanningSessionQueryBuilder.getRawMany.mockResolvedValue([
        {
          careSettingId: 'tmpl-1',
          careSettingName: 'ACUTE Care',
          healthAuthority: 'Fraser Health',
          count: '42',
        },
      ]);

      const result = await service.getCarePlansBySetting({});

      expect(result[0].count).toBe(42);
      expect(typeof result[0].count).toBe('number');
    });
  });

  describe('getKPIsOverview', () => {
    beforeEach(() => {
      mockUserQueryBuilder.getCount
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(50); // activeUsers
      mockPlanningSessionQueryBuilder.getCount.mockResolvedValue(200);
    });

    it('should return combined general and carePlansBySetting', async () => {
      mockPlanningSessionQueryBuilder.getRawMany.mockResolvedValue([
        {
          careSettingId: 'tmpl-1',
          careSettingName: 'ACUTE Care',
          healthAuthority: 'Fraser Health',
          count: '10',
        },
      ]);

      const result = await service.getKPIsOverview({});

      expect(result).toBeInstanceOf(KPIsOverviewRO);
      expect(result.general).toBeDefined();
      expect(result.general.totalUsers).toBe(100);
      expect(result.carePlansBySetting).toBeDefined();
      expect(result.carePlansBySetting).toHaveLength(1);
    });

    it('should return empty carePlansBySetting with populated general', async () => {
      mockPlanningSessionQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.getKPIsOverview({});

      expect(result.general.totalUsers).toBe(100);
      expect(result.carePlansBySetting).toEqual([]);
    });

    it('should pass filter to both sub-queries', async () => {
      mockPlanningSessionQueryBuilder.getRawMany.mockResolvedValue([]);

      const filter = { healthAuthority: 'Fraser Health' };
      await service.getKPIsOverview(filter);

      // getCarePlansBySetting should filter by template HA
      expect(mockPlanningSessionQueryBuilder.andWhere).toHaveBeenCalledWith(
        'cst.healthAuthority IN (:...authorities)',
        { authorities: ['Fraser Health', 'GLOBAL'] },
      );
    });
  });

  describe('getCareSettings', () => {
    const mockTemplateResults = [
      { id: 'tmpl-1', displayName: 'ACUTE Care', healthAuthority: 'GLOBAL' },
      { id: 'tmpl-2', displayName: 'ACUTE Care', healthAuthority: 'Fraser Health' },
      { id: 'tmpl-3', displayName: 'Emergency', healthAuthority: 'GLOBAL' },
    ];

    it('should return all templates when no HA filter (admin)', async () => {
      mockTemplateQueryBuilder.getRawMany.mockResolvedValue(mockTemplateResults);

      const result = await service.getCareSettings(null);

      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(KPICareSettingRO);
      expect(result[0].id).toBe('tmpl-1');
      expect(result[0].displayName).toBe('ACUTE Care');
      expect(result[0].healthAuthority).toBe('GLOBAL');
      expect(mockTemplateQueryBuilder.where).not.toHaveBeenCalled();
    });

    it('should filter by HA + GLOBAL for content admin', async () => {
      mockTemplateQueryBuilder.getRawMany.mockResolvedValue([
        mockTemplateResults[0],
        mockTemplateResults[1],
      ]);

      await service.getCareSettings('Fraser Health');

      expect(mockTemplateQueryBuilder.where).toHaveBeenCalledWith(
        'cst.healthAuthority IN (:...authorities)',
        { authorities: ['Fraser Health', 'GLOBAL'] },
      );
    });

    it('should return empty array when no templates exist', async () => {
      mockTemplateQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.getCareSettings(null);

      expect(result).toEqual([]);
    });

    it('should order by displayName then healthAuthority', async () => {
      mockTemplateQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.getCareSettings(null);

      expect(mockTemplateQueryBuilder.orderBy).toHaveBeenCalledWith('u.displayName', 'ASC');
      expect(mockTemplateQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'cst.healthAuthority',
        'ASC',
      );
    });

    it('should strip extra fields from results', async () => {
      mockTemplateQueryBuilder.getRawMany.mockResolvedValue([
        { id: 'tmpl-1', displayName: 'ACUTE Care', healthAuthority: 'GLOBAL', extraField: true },
      ]);

      const result = await service.getCareSettings(null);

      expect(result[0]).toBeInstanceOf(KPICareSettingRO);
      expect(result[0].id).toBe('tmpl-1');
      expect(result[0].displayName).toBe('ACUTE Care');
      expect(result[0].healthAuthority).toBe('GLOBAL');
      expect(result[0]).not.toHaveProperty('extraField');
    });
  });
});
