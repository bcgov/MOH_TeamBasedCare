import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CareSettingTemplateController } from './care-setting-template.controller';
import { CareSettingTemplateService } from './care-setting-template.service';
import { Role } from '@tbcm/common';

describe('CareSettingTemplateController', () => {
  let controller: CareSettingTemplateController;

  const mockTemplateService = {
    findTemplates: jest.fn(),
    findAllForCMSFilter: jest.fn(),
    getTemplateBasic: jest.fn(),
    getTemplateForCopy: jest.fn(),
    getTemplateById: jest.fn(),
    getBundlesForTemplate: jest.fn(),
    getOccupationsForTemplate: jest.fn(),
    copyTemplate: jest.fn(),
    copyTemplateWithData: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
  };

  const createMockRequest = (overrides: any = {}) =>
    ({
      user: {
        id: 'user-1',
        roles: [Role.USER],
        organization: 'Fraser Health',
        ...overrides,
      },
    }) as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CareSettingTemplateController],
      providers: [
        {
          provide: CareSettingTemplateService,
          useValue: mockTemplateService,
        },
      ],
    }).compile();

    controller = module.get<CareSettingTemplateController>(CareSettingTemplateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── findTemplates ─────────────────────────────────────────────────
  describe('findTemplates', () => {
    beforeEach(() => {
      mockTemplateService.findTemplates.mockResolvedValue([[], 0]);
    });

    it('should pass null HA for ADMIN users', async () => {
      const req = createMockRequest({ roles: [Role.ADMIN] });
      await controller.findTemplates({} as any, req);

      expect(mockTemplateService.findTemplates).toHaveBeenCalledWith({}, null);
    });

    it('should pass null HA for CONTENT_ADMIN users', async () => {
      const req = createMockRequest({ roles: [Role.CONTENT_ADMIN] });
      await controller.findTemplates({} as any, req);

      expect(mockTemplateService.findTemplates).toHaveBeenCalledWith({}, null);
    });

    it('should pass user organization for regular users', async () => {
      const req = createMockRequest({ roles: [Role.USER], organization: 'Fraser Health' });
      await controller.findTemplates({} as any, req);

      expect(mockTemplateService.findTemplates).toHaveBeenCalledWith({}, 'Fraser Health');
    });

    it('should pass empty string when user has no organization', async () => {
      const req = createMockRequest({ roles: [Role.USER], organization: undefined });
      await controller.findTemplates({} as any, req);

      expect(mockTemplateService.findTemplates).toHaveBeenCalledWith({}, '');
    });
  });

  // ─── getTemplatesForCMSFilter ──────────────────────────────────────
  describe('getTemplatesForCMSFilter', () => {
    beforeEach(() => {
      mockTemplateService.findAllForCMSFilter.mockResolvedValue([]);
    });

    it('should pass null for CONTENT_ADMIN', async () => {
      const req = createMockRequest({ roles: [Role.CONTENT_ADMIN] });
      await controller.getTemplatesForCMSFilter(req);

      expect(mockTemplateService.findAllForCMSFilter).toHaveBeenCalledWith(null);
    });

    it('should pass null for ADMIN', async () => {
      const req = createMockRequest({ roles: [Role.ADMIN] });
      await controller.getTemplatesForCMSFilter(req);

      expect(mockTemplateService.findAllForCMSFilter).toHaveBeenCalledWith(null);
    });

    it('should pass organization for regular users', async () => {
      const req = createMockRequest({ roles: [Role.USER], organization: 'Interior Health' });
      await controller.getTemplatesForCMSFilter(req);

      expect(mockTemplateService.findAllForCMSFilter).toHaveBeenCalledWith('Interior Health');
    });
  });

  // ─── getHealthAuthorityForCopy (tested via copy endpoints) ─────────
  describe('copyTemplate - HA logic', () => {
    beforeEach(() => {
      mockTemplateService.copyTemplate.mockResolvedValue({});
    });

    it('should use GLOBAL for ADMIN users', async () => {
      const req = createMockRequest({ roles: [Role.ADMIN] });
      await controller.copyTemplate('tmpl-1', { name: 'Copy' } as any, req);

      expect(mockTemplateService.copyTemplate).toHaveBeenCalledWith(
        'tmpl-1',
        { name: 'Copy' },
        'GLOBAL',
      );
    });

    it('should use GLOBAL for CONTENT_ADMIN users', async () => {
      const req = createMockRequest({ roles: [Role.CONTENT_ADMIN] });
      await controller.copyTemplate('tmpl-1', { name: 'Copy' } as any, req);

      expect(mockTemplateService.copyTemplate).toHaveBeenCalledWith(
        'tmpl-1',
        { name: 'Copy' },
        'GLOBAL',
      );
    });

    it('should use user organization for regular users', async () => {
      const req = createMockRequest({ roles: [Role.USER], organization: 'Fraser Health' });
      await controller.copyTemplate('tmpl-1', { name: 'Copy' } as any, req);

      expect(mockTemplateService.copyTemplate).toHaveBeenCalledWith(
        'tmpl-1',
        { name: 'Copy' },
        'Fraser Health',
      );
    });

    it('should throw BadRequestException when non-admin has no organization', async () => {
      const req = createMockRequest({ roles: [Role.USER], organization: undefined });

      await expect(controller.copyTemplate('tmpl-1', { name: 'Copy' } as any, req)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('copyTemplateWithData', () => {
    it('should delegate with correct HA', async () => {
      mockTemplateService.copyTemplateWithData.mockResolvedValue({});
      const req = createMockRequest({ roles: [Role.ADMIN] });

      await controller.copyTemplateWithData('tmpl-1', {} as any, req);

      expect(mockTemplateService.copyTemplateWithData).toHaveBeenCalledWith('tmpl-1', {}, 'GLOBAL');
    });
  });

  // ─── getTemplateForCopy ────────────────────────────────────────────
  describe('getTemplateForCopy', () => {
    it('should validate access then return copy data', async () => {
      mockTemplateService.getTemplateBasic.mockResolvedValue({
        id: 'tmpl-1',
        healthAuthority: 'GLOBAL',
      });
      mockTemplateService.getTemplateForCopy.mockResolvedValue({ id: 'tmpl-1' });

      const req = createMockRequest();
      const result = await controller.getTemplateForCopy('tmpl-1', req);

      expect(result).toEqual({ id: 'tmpl-1' });
      expect(mockTemplateService.getTemplateBasic).toHaveBeenCalledWith('tmpl-1');
    });

    it('should throw ForbiddenException for wrong HA', async () => {
      mockTemplateService.getTemplateBasic.mockResolvedValue({
        id: 'tmpl-1',
        healthAuthority: 'Interior Health',
      });

      const req = createMockRequest({ organization: 'Fraser Health' });

      await expect(controller.getTemplateForCopy('tmpl-1', req)).rejects.toThrow();
    });
  });

  // ─── getTemplateById ───────────────────────────────────────────────
  describe('getTemplateById', () => {
    it('should delegate to service', async () => {
      const mockDetail = { id: 'tmpl-1', healthAuthority: 'GLOBAL' };
      mockTemplateService.getTemplateById.mockResolvedValue(mockDetail);

      const req = createMockRequest();
      const result = await controller.getTemplateById('tmpl-1', req);

      expect(result).toEqual(mockDetail);
    });
  });

  // ─── getBundlesForTemplate ─────────────────────────────────────────
  describe('getBundlesForTemplate', () => {
    it('should validate access then return bundles', async () => {
      mockTemplateService.getTemplateBasic.mockResolvedValue({
        id: 'tmpl-1',
        healthAuthority: 'GLOBAL',
      });
      mockTemplateService.getBundlesForTemplate.mockResolvedValue([]);

      const req = createMockRequest();
      const result = await controller.getBundlesForTemplate('tmpl-1', req);

      expect(result).toEqual([]);
    });
  });

  // ─── getOccupationsForTemplate ─────────────────────────────────────
  describe('getOccupationsForTemplate', () => {
    it('should validate access then return occupations', async () => {
      mockTemplateService.getTemplateBasic.mockResolvedValue({
        id: 'tmpl-1',
        healthAuthority: 'GLOBAL',
      });
      mockTemplateService.getOccupationsForTemplate.mockResolvedValue([]);

      const req = createMockRequest();
      const result = await controller.getOccupationsForTemplate('tmpl-1', req);

      expect(result).toEqual([]);
    });

    it('should throw for wrong HA', async () => {
      mockTemplateService.getTemplateBasic.mockResolvedValue({
        id: 'tmpl-1',
        healthAuthority: 'Interior Health',
      });

      const req = createMockRequest({ organization: 'Fraser Health' });

      await expect(controller.getOccupationsForTemplate('tmpl-1', req)).rejects.toThrow();
    });
  });

  // ─── updateTemplate ────────────────────────────────────────────────
  describe('updateTemplate', () => {
    it('should pass user organization to service', async () => {
      mockTemplateService.updateTemplate.mockResolvedValue(undefined);
      const req = createMockRequest({ organization: 'Fraser Health' });

      await controller.updateTemplate('tmpl-1', {} as any, req);

      expect(mockTemplateService.updateTemplate).toHaveBeenCalledWith(
        'tmpl-1',
        {},
        'Fraser Health',
      );
    });
  });

  // ─── deleteTemplate ────────────────────────────────────────────────
  describe('deleteTemplate', () => {
    it('should pass user organization to service', async () => {
      mockTemplateService.deleteTemplate.mockResolvedValue(undefined);
      const req = createMockRequest({ organization: 'Fraser Health' });

      await controller.deleteTemplate('tmpl-1', req);

      expect(mockTemplateService.deleteTemplate).toHaveBeenCalledWith('tmpl-1', 'Fraser Health');
    });
  });
});
