import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { KpiService } from './kpi.service';
import { User } from 'src/user/entities/user.entity';
import { PlanningSession } from 'src/planning-session/entity/planning-session.entity';
import { Unit } from 'src/unit/entity/unit.entity';
import { GeneralKPIsRO, CarePlansBySettingRO, KPIsOverviewRO } from '@tbcm/common';

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
    getRawMany: jest.fn(),
  });

  let mockUserQueryBuilder: ReturnType<typeof createMockQueryBuilder>;
  let mockPlanningSessionQueryBuilder: ReturnType<typeof createMockQueryBuilder>;

  const mockUserRepo = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockPlanningSessionRepo = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUnitRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create fresh query builders for each test
    mockUserQueryBuilder = createMockQueryBuilder();
    mockPlanningSessionQueryBuilder = createMockQueryBuilder();

    mockUserRepo.createQueryBuilder.mockReturnValue(mockUserQueryBuilder);
    mockPlanningSessionRepo.createQueryBuilder.mockReturnValue(mockPlanningSessionQueryBuilder);

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
          provide: getRepositoryToken(Unit),
          useValue: mockUnitRepo,
        },
      ],
    }).compile();

    service = module.get<KpiService>(KpiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGeneralKPIs', () => {
    it('should return total users excluding revoked', async () => {
      mockUserRepo.count.mockResolvedValue(100);
      mockUserQueryBuilder.getCount.mockResolvedValue(50);
      mockPlanningSessionRepo.count.mockResolvedValue(200);

      const result = await service.getGeneralKPIs();

      expect(result).toBeInstanceOf(GeneralKPIsRO);
      expect(result.totalUsers).toBe(100);
      expect(mockUserRepo.count).toHaveBeenCalledWith({
        where: { revokedAt: expect.anything() },
      });
    });

    it('should return active users from current month', async () => {
      mockUserRepo.count.mockResolvedValue(100);
      mockUserQueryBuilder.getCount.mockResolvedValue(50);
      mockPlanningSessionRepo.count.mockResolvedValue(200);

      const result = await service.getGeneralKPIs();

      expect(result.activeUsers).toBe(50);
      expect(mockUserRepo.createQueryBuilder).toHaveBeenCalledWith('u');
      expect(mockUserQueryBuilder.where).toHaveBeenCalledWith(
        'u.lastLoginAt >= :startOfMonth',
        expect.objectContaining({ startOfMonth: expect.any(Date) }),
      );
      expect(mockUserQueryBuilder.andWhere).toHaveBeenCalledWith('u.revokedAt IS NULL');
    });

    it('should return total care plans', async () => {
      mockUserRepo.count.mockResolvedValue(100);
      mockUserQueryBuilder.getCount.mockResolvedValue(50);
      mockPlanningSessionRepo.count.mockResolvedValue(200);

      const result = await service.getGeneralKPIs();

      expect(result.totalCarePlans).toBe(200);
      expect(mockPlanningSessionRepo.count).toHaveBeenCalled();
    });

    it('should handle zero counts', async () => {
      mockUserRepo.count.mockResolvedValue(0);
      mockUserQueryBuilder.getCount.mockResolvedValue(0);
      mockPlanningSessionRepo.count.mockResolvedValue(0);

      const result = await service.getGeneralKPIs();

      expect(result.totalUsers).toBe(0);
      expect(result.activeUsers).toBe(0);
      expect(result.totalCarePlans).toBe(0);
    });
  });

  describe('getCarePlansBySetting', () => {
    const mockRawResults = [
      {
        careSettingId: 'unit-1',
        careSettingName: 'ACUTE Care',
        healthAuthority: 'Fraser Health',
        count: '10',
      },
      {
        careSettingId: 'unit-2',
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
      expect(result[0].careSettingId).toBe('unit-1');
      expect(result[0].careSettingName).toBe('ACUTE Care');
      expect(result[0].healthAuthority).toBe('Fraser Health');
      expect(result[0].count).toBe(10);

      expect(mockPlanningSessionQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'ps.careLocation',
        'u',
      );
      expect(mockPlanningSessionQueryBuilder.innerJoin).toHaveBeenCalledWith('ps.createdBy', 'usr');
      expect(mockPlanningSessionQueryBuilder.groupBy).toHaveBeenCalledWith('u.id');
    });

    it('should filter by health authority', async () => {
      mockPlanningSessionQueryBuilder.getRawMany.mockResolvedValue([mockRawResults[0]]);

      await service.getCarePlansBySetting({ healthAuthority: 'Fraser Health' });

      expect(mockPlanningSessionQueryBuilder.andWhere).toHaveBeenCalledWith(
        'usr.organization = :healthAuthority',
        { healthAuthority: 'Fraser Health' },
      );
    });

    it('should filter by care setting', async () => {
      mockPlanningSessionQueryBuilder.getRawMany.mockResolvedValue([mockRawResults[0]]);

      await service.getCarePlansBySetting({ careSettingId: 'unit-1' });

      expect(mockPlanningSessionQueryBuilder.andWhere).toHaveBeenCalledWith(
        'u.id = :careSettingId',
        { careSettingId: 'unit-1' },
      );
    });

    it('should apply both filters', async () => {
      mockPlanningSessionQueryBuilder.getRawMany.mockResolvedValue([mockRawResults[0]]);

      await service.getCarePlansBySetting({
        healthAuthority: 'Fraser Health',
        careSettingId: 'unit-1',
      });

      expect(mockPlanningSessionQueryBuilder.andWhere).toHaveBeenCalledWith(
        'usr.organization = :healthAuthority',
        { healthAuthority: 'Fraser Health' },
      );
      expect(mockPlanningSessionQueryBuilder.andWhere).toHaveBeenCalledWith(
        'u.id = :careSettingId',
        { careSettingId: 'unit-1' },
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
          careSettingId: 'unit-1',
          careSettingName: 'ACUTE Care',
          healthAuthority: null,
          count: '10',
        },
      ]);

      const result = await service.getCarePlansBySetting({});

      expect(result[0].healthAuthority).toBe('Unknown');
    });

    it('should parse count as integer', async () => {
      mockPlanningSessionQueryBuilder.getRawMany.mockResolvedValue([
        {
          careSettingId: 'unit-1',
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
    it('should return combined general and carePlansBySetting', async () => {
      // Setup mocks for getGeneralKPIs
      mockUserRepo.count.mockResolvedValue(100);
      mockUserQueryBuilder.getCount.mockResolvedValue(50);
      mockPlanningSessionRepo.count.mockResolvedValue(200);

      // Setup mocks for getCarePlansBySetting
      mockPlanningSessionQueryBuilder.getRawMany.mockResolvedValue([
        {
          careSettingId: 'unit-1',
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

    it('should pass filter to getCarePlansBySetting', async () => {
      mockUserRepo.count.mockResolvedValue(100);
      mockUserQueryBuilder.getCount.mockResolvedValue(50);
      mockPlanningSessionRepo.count.mockResolvedValue(200);
      mockPlanningSessionQueryBuilder.getRawMany.mockResolvedValue([]);

      const filter = { healthAuthority: 'Fraser Health' };
      await service.getKPIsOverview(filter);

      expect(mockPlanningSessionQueryBuilder.andWhere).toHaveBeenCalledWith(
        'usr.organization = :healthAuthority',
        { healthAuthority: 'Fraser Health' },
      );
    });
  });

  describe('getCareSettings', () => {
    it('should return all units with id and displayName', async () => {
      const mockUnits = [
        { id: 'unit-1', displayName: 'ACUTE Care' },
        { id: 'unit-2', displayName: 'Emergency' },
      ];
      mockUnitRepo.find.mockResolvedValue(mockUnits);

      const result = await service.getCareSettings();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'unit-1', displayName: 'ACUTE Care' });
      expect(result[1]).toEqual({ id: 'unit-2', displayName: 'Emergency' });
    });

    it('should order by displayName ascending', async () => {
      mockUnitRepo.find.mockResolvedValue([]);

      await service.getCareSettings();

      expect(mockUnitRepo.find).toHaveBeenCalledWith({
        select: ['id', 'displayName'],
        order: { displayName: 'ASC' },
      });
    });

    it('should return empty array when no units exist', async () => {
      mockUnitRepo.find.mockResolvedValue([]);

      const result = await service.getCareSettings();

      expect(result).toEqual([]);
    });
  });
});
