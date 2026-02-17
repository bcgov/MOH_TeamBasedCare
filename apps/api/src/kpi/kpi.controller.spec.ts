import { Test, TestingModule } from '@nestjs/testing';
import { KpiController } from './kpi.controller';
import { KpiService } from './kpi.service';
import { KPIsOverviewRO, GeneralKPIsRO, CarePlansBySettingRO, Role } from '@tbcm/common';

describe('KpiController', () => {
  let controller: KpiController;

  const mockKpiService = {
    getKPIsOverview: jest.fn(),
    getCareSettings: jest.fn(),
  };

  const createMockReq = (roles: Role[], organization?: string) => ({
    user: {
      id: 'user-1',
      roles,
      organization,
    },
  });

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
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOverview', () => {
    const mockOverview = new KPIsOverviewRO({
      general: new GeneralKPIsRO({
        totalUsers: 100,
        activeUsers: 50,
        totalCarePlans: 200,
      }),
      carePlansBySetting: [
        new CarePlansBySettingRO({
          careSettingId: 'tmpl-1',
          careSettingName: 'ACUTE Care',
          healthAuthority: 'Fraser Health',
          count: 10,
        }),
      ],
    });

    it('should pass filter as-is for admin users', async () => {
      mockKpiService.getKPIsOverview.mockResolvedValue(mockOverview);
      const req = createMockReq([Role.ADMIN]);

      const filter = { healthAuthority: 'Fraser Health' };
      const result = await controller.getOverview(filter, req as any);

      expect(mockKpiService.getKPIsOverview).toHaveBeenCalledWith(filter);
      expect(result).toBe(mockOverview);
    });

    it('should override HA filter for content admin', async () => {
      mockKpiService.getKPIsOverview.mockResolvedValue(mockOverview);
      const req = createMockReq([Role.CONTENT_ADMIN], 'Interior Health');

      const filter = { healthAuthority: 'Fraser Health' };
      await controller.getOverview(filter, req as any);

      expect(mockKpiService.getKPIsOverview).toHaveBeenCalledWith({
        healthAuthority: 'Interior Health',
      });
    });

    it('should pass empty filter for admin', async () => {
      mockKpiService.getKPIsOverview.mockResolvedValue(mockOverview);
      const req = createMockReq([Role.ADMIN]);

      await controller.getOverview({}, req as any);

      expect(mockKpiService.getKPIsOverview).toHaveBeenCalledWith({});
    });

    it('should pass careSettingId filter for admin', async () => {
      mockKpiService.getKPIsOverview.mockResolvedValue(mockOverview);
      const req = createMockReq([Role.ADMIN]);

      const filter = { careSettingId: 'tmpl-1' };
      await controller.getOverview(filter, req as any);

      expect(mockKpiService.getKPIsOverview).toHaveBeenCalledWith({ careSettingId: 'tmpl-1' });
    });
  });

  describe('getCareSettings', () => {
    const mockCareSettings = [
      { id: 'tmpl-1', displayName: 'ACUTE Care', healthAuthority: 'GLOBAL' },
      { id: 'tmpl-2', displayName: 'ACUTE Care', healthAuthority: 'Fraser Health' },
    ];

    it('should pass null HA for admin (sees all templates)', async () => {
      mockKpiService.getCareSettings.mockResolvedValue(mockCareSettings);
      const req = createMockReq([Role.ADMIN]);

      const result = await controller.getCareSettings(req as any);

      expect(mockKpiService.getCareSettings).toHaveBeenCalledWith(null);
      expect(result).toBe(mockCareSettings);
    });

    it('should pass user org for content admin', async () => {
      mockKpiService.getCareSettings.mockResolvedValue([mockCareSettings[1]]);
      const req = createMockReq([Role.CONTENT_ADMIN], 'Fraser Health');

      await controller.getCareSettings(req as any);

      expect(mockKpiService.getCareSettings).toHaveBeenCalledWith('Fraser Health');
    });

    it('should pass empty string when content admin has no org', async () => {
      mockKpiService.getCareSettings.mockResolvedValue([]);
      const req = createMockReq([Role.CONTENT_ADMIN]);

      await controller.getCareSettings(req as any);

      expect(mockKpiService.getCareSettings).toHaveBeenCalledWith('');
    });

    it('should return empty array when no care settings exist', async () => {
      mockKpiService.getCareSettings.mockResolvedValue([]);
      const req = createMockReq([Role.ADMIN]);

      const result = await controller.getCareSettings(req as any);

      expect(result).toEqual([]);
    });

    it('should propagate service errors', async () => {
      mockKpiService.getCareSettings.mockRejectedValue(new Error('DB error'));
      const req = createMockReq([Role.ADMIN]);

      await expect(controller.getCareSettings(req as any)).rejects.toThrow('DB error');
    });
  });
});
