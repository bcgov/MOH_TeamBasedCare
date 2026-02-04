import { Test, TestingModule } from '@nestjs/testing';
import { KpiController } from './kpi.controller';
import { KpiService } from './kpi.service';
import { KPIsOverviewRO, GeneralKPIsRO, CarePlansBySettingRO } from '@tbcm/common';

describe('KpiController', () => {
  let controller: KpiController;
  let kpiService: KpiService;

  const mockKpiService = {
    getKPIsOverview: jest.fn(),
    getCareSettings: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KpiController],
      providers: [
        {
          provide: KpiService,
          useValue: mockKpiService,
        },
      ],
    }).compile();

    controller = module.get<KpiController>(KpiController);
    kpiService = module.get<KpiService>(KpiService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOverview', () => {
    it('should call kpiService.getKPIsOverview with filter', async () => {
      const mockOverview = new KPIsOverviewRO({
        general: new GeneralKPIsRO({
          totalUsers: 100,
          activeUsers: 50,
          totalCarePlans: 200,
        }),
        carePlansBySetting: [
          new CarePlansBySettingRO({
            careSettingId: 'unit-1',
            careSettingName: 'ACUTE Care',
            healthAuthority: 'Fraser Health',
            count: 10,
          }),
        ],
      });

      mockKpiService.getKPIsOverview.mockResolvedValue(mockOverview);

      const filter = { healthAuthority: 'Fraser Health' };
      const result = await controller.getOverview(filter);

      expect(mockKpiService.getKPIsOverview).toHaveBeenCalledWith(filter);
      expect(result).toBe(mockOverview);
    });

    it('should call kpiService.getKPIsOverview with empty filter', async () => {
      const mockOverview = new KPIsOverviewRO({
        general: new GeneralKPIsRO({
          totalUsers: 100,
          activeUsers: 50,
          totalCarePlans: 200,
        }),
        carePlansBySetting: [],
      });

      mockKpiService.getKPIsOverview.mockResolvedValue(mockOverview);

      const result = await controller.getOverview({});

      expect(mockKpiService.getKPIsOverview).toHaveBeenCalledWith({});
      expect(result).toBe(mockOverview);
    });
  });

  describe('getCareSettings', () => {
    it('should call kpiService.getCareSettings', async () => {
      const mockCareSettings = [
        { id: 'unit-1', displayName: 'ACUTE Care' },
        { id: 'unit-2', displayName: 'Emergency' },
      ];

      mockKpiService.getCareSettings.mockResolvedValue(mockCareSettings);

      const result = await controller.getCareSettings();

      expect(mockKpiService.getCareSettings).toHaveBeenCalled();
      expect(result).toBe(mockCareSettings);
    });

    it('should return empty array when no care settings exist', async () => {
      mockKpiService.getCareSettings.mockResolvedValue([]);

      const result = await controller.getCareSettings();

      expect(result).toEqual([]);
    });
  });
});
