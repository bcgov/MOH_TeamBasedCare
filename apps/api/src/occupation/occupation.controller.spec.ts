import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OccupationController } from './occupation.controller';
import { OccupationService } from './occupation.service';

describe('OccupationController', () => {
  let controller: OccupationController;

  const mockOccupation = {
    id: 'occ-1',
    name: 'registerednurse',
    displayName: 'Registered Nurse',
    displayOrder: 1,
    description: 'A regulated healthcare professional',
    isRegulated: true,
    relatedResources: [],
    allowedActivities: [],
  };

  const mockOccupationService = {
    getAllOccupations: jest.fn(),
    findOccupations: jest.fn(),
    findOccupationsCMS: jest.fn(),
    getOccupationDetailById: jest.fn(),
    createOccupation: jest.fn(),
    updateOccupationWithScope: jest.fn(),
    deleteOccupation: jest.fn(),
    findOccupationById: jest.fn(),
    updateOccupation: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OccupationController],
      providers: [
        {
          provide: OccupationService,
          useValue: mockOccupationService,
        },
      ],
    }).compile();

    controller = module.get<OccupationController>(OccupationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllOccupations', () => {
    it('should delegate to service', async () => {
      mockOccupationService.getAllOccupations.mockResolvedValue([mockOccupation]);

      const result = await controller.getAllOccupations();

      expect(result).toEqual([mockOccupation]);
      expect(mockOccupationService.getAllOccupations).toHaveBeenCalled();
    });
  });

  describe('findOccupations', () => {
    it('should return PaginationRO with OccupationRO items', async () => {
      mockOccupationService.findOccupations.mockResolvedValue([[mockOccupation], 1]);

      const query = { page: 1, pageSize: 10 } as any;
      const result = await controller.findOccupations(query);

      expect(result.result).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findOccupationsCMS', () => {
    it('should return PaginationRO with OccupationCMSRO items', async () => {
      mockOccupationService.findOccupationsCMS.mockResolvedValue([[mockOccupation], 1]);

      const query = { page: 1, pageSize: 10 } as any;
      const result = await controller.findOccupationsCMS(query);

      expect(result.result).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getOccupationCMSById', () => {
    it('should return OccupationDetailRO', async () => {
      mockOccupationService.getOccupationDetailById.mockResolvedValue(mockOccupation);

      const result = await controller.getOccupationCMSById('occ-1');

      expect(result.id).toBe('occ-1');
      expect(result.displayName).toBe('Registered Nurse');
    });

    it('should throw NotFoundException when not found', async () => {
      mockOccupationService.getOccupationDetailById.mockResolvedValue(null);

      await expect(controller.getOccupationCMSById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createOccupation', () => {
    it('should create and return OccupationRO', async () => {
      mockOccupationService.createOccupation.mockResolvedValue(mockOccupation);

      const dto = { name: 'Registered Nurse', description: 'Desc', isRegulated: true } as any;
      const result = await controller.createOccupation(dto);

      expect(result.id).toBe('occ-1');
      expect(mockOccupationService.createOccupation).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateOccupationCMS', () => {
    it('should delegate to updateOccupationWithScope', async () => {
      mockOccupationService.updateOccupationWithScope.mockResolvedValue(undefined);

      await controller.updateOccupationCMS('occ-1', { description: 'Updated' } as any);

      expect(mockOccupationService.updateOccupationWithScope).toHaveBeenCalledWith('occ-1', {
        description: 'Updated',
      });
    });
  });

  describe('deleteOccupation', () => {
    it('should delegate to service', async () => {
      mockOccupationService.deleteOccupation.mockResolvedValue(undefined);

      await controller.deleteOccupation('occ-1');

      expect(mockOccupationService.deleteOccupation).toHaveBeenCalledWith('occ-1');
    });
  });

  describe('getOccupationsById', () => {
    it('should return OccupationRO', async () => {
      mockOccupationService.findOccupationById.mockResolvedValue(mockOccupation);

      const result = await controller.getOccupationsById('occ-1');

      expect(result.id).toBe('occ-1');
    });

    it('should throw NotFoundException when not found', async () => {
      mockOccupationService.findOccupationById.mockResolvedValue(null);

      await expect(controller.getOccupationsById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOccupationById', () => {
    it('should delegate to service', async () => {
      mockOccupationService.updateOccupation.mockResolvedValue(undefined);

      await controller.updateOccupationById({ displayName: 'Updated' } as any, 'occ-1');

      expect(mockOccupationService.updateOccupation).toHaveBeenCalledWith('occ-1', {
        displayName: 'Updated',
      });
    });
  });
});
