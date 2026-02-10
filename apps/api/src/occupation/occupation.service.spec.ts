import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OccupationService } from './occupation.service';
import { Occupation } from './entity/occupation.entity';
import { AllowedActivity } from '../allowed-activity/entity/allowed-activity.entity';
import { OccupationsCMSFindSortKeys, OccupationsFindSortKeys, SortOrder } from '@tbcm/common';

describe('OccupationService', () => {
  let service: OccupationService;

  const createMockQueryBuilder = () => ({
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getMany: jest.fn(),
  });

  let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;

  const mockOccupationRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAllowedActivityRepo = {
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

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

  beforeEach(async () => {
    jest.clearAllMocks();

    mockQueryBuilder = createMockQueryBuilder();
    mockOccupationRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OccupationService,
        {
          provide: getRepositoryToken(Occupation),
          useValue: mockOccupationRepo,
        },
        {
          provide: getRepositoryToken(AllowedActivity),
          useValue: mockAllowedActivityRepo,
        },
      ],
    }).compile();

    service = module.get<OccupationService>(OccupationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllOccupations', () => {
    it('should return all occupations', async () => {
      mockOccupationRepo.find.mockResolvedValue([mockOccupation]);

      const result = await service.getAllOccupations();

      expect(result).toEqual([mockOccupation]);
      expect(mockOccupationRepo.find).toHaveBeenCalled();
    });

    it('should return empty array when none exist', async () => {
      mockOccupationRepo.find.mockResolvedValue([]);

      const result = await service.getAllOccupations();

      expect(result).toEqual([]);
    });
  });

  describe('findOccupationById', () => {
    it('should return occupation when found', async () => {
      mockOccupationRepo.findOneBy.mockResolvedValue(mockOccupation);

      const result = await service.findOccupationById('occ-1');

      expect(result).toEqual(mockOccupation);
      expect(mockOccupationRepo.findOneBy).toHaveBeenCalledWith({ id: 'occ-1' });
    });

    it('should return null when not found', async () => {
      mockOccupationRepo.findOneBy.mockResolvedValue(null);

      const result = await service.findOccupationById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findOccupations', () => {
    it('should return paginated occupations without search', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockOccupation], 1]);

      const result = await service.findOccupations({ page: 1, pageSize: 10 } as any);

      expect(result).toEqual([[mockOccupation], 1]);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should apply search across occupation name, description, and care activity name', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findOccupations({
        page: 1,
        pageSize: 10,
        searchText: 'nurse',
      } as any);

      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith('o.allowedActivities', 'o_aa');
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith('o_aa.careActivity', 'o_aa_ca');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('o_aa_ca.displayName ILIKE :name', {
        name: '%nurse%',
      });
      expect(mockQueryBuilder.orWhere).toHaveBeenCalledWith('o.displayName ILIKE :name', {
        name: '%nurse%',
      });
    });

    it('should sort by provided sortBy field', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findOccupations({
        page: 1,
        pageSize: 10,
        sortBy: OccupationsFindSortKeys.DISPLAY_NAME,
        sortOrder: SortOrder.ASC,
      } as any);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('o.displayName', 'ASC');
    });

    it('should reverse sort order for isRegulated boolean field', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findOccupations({
        page: 1,
        pageSize: 10,
        sortBy: OccupationsFindSortKeys.IS_REGULATED,
        sortOrder: SortOrder.ASC,
      } as any);

      // ASC should become DESC because boolean true/false sorts opposite to Regulated/Unregulated
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('o.isRegulated', 'DESC');
    });

    it('should calculate correct skip value for page 2', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findOccupations({ page: 2, pageSize: 10 } as any);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should not apply search when searchText is empty', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findOccupations({ page: 1, pageSize: 10, searchText: '' } as any);

      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
    });
  });

  describe('findOccupationsCMS', () => {
    it('should return paginated occupations with updatedBy relation', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockOccupation], 1]);

      const result = await service.findOccupationsCMS({ page: 1, pageSize: 10 } as any);

      expect(result).toEqual([[mockOccupation], 1]);
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('o.updatedBy', 'updatedBy');
    });

    it('should search by displayName or description', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findOccupationsCMS({
        page: 1,
        pageSize: 10,
        searchText: 'nurse',
      } as any);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(o.displayName ILIKE :search OR o.description ILIKE :search)',
        { search: '%nurse%' },
      );
    });

    it('should default sort by displayName ASC when no sortBy', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findOccupationsCMS({ page: 1, pageSize: 10 } as any);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('o.displayName', 'ASC');
    });

    it('should reverse sort order for isRegulated boolean', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findOccupationsCMS({
        page: 1,
        pageSize: 10,
        sortBy: OccupationsCMSFindSortKeys.IS_REGULATED,
        sortOrder: SortOrder.ASC,
      } as any);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('o.isRegulated', 'DESC');
    });

    it('should sort by custom field when sortBy is provided', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findOccupationsCMS({
        page: 1,
        pageSize: 10,
        sortBy: OccupationsCMSFindSortKeys.UPDATED_AT,
        sortOrder: SortOrder.DESC,
      } as any);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('o.updatedAt', 'DESC');
    });
  });

  describe('getOccupationDetailById', () => {
    it('should return occupation with all relations', async () => {
      mockOccupationRepo.findOne.mockResolvedValue(mockOccupation);

      const result = await service.getOccupationDetailById('occ-1');

      expect(result).toEqual(mockOccupation);
      expect(mockOccupationRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'occ-1' },
        relations: [
          'updatedBy',
          'allowedActivities',
          'allowedActivities.careActivity',
          'allowedActivities.careActivity.bundle',
          'allowedActivities.unit',
        ],
      });
    });

    it('should return null when not found', async () => {
      mockOccupationRepo.findOne.mockResolvedValue(null);

      const result = await service.getOccupationDetailById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createOccupation', () => {
    it('should create occupation and return saved entity', async () => {
      mockOccupationRepo.findOne.mockResolvedValue(null); // no duplicate
      mockOccupationRepo.create.mockReturnValue(mockOccupation);
      mockOccupationRepo.save.mockResolvedValue(mockOccupation);

      const dto = {
        name: 'Registered Nurse',
        description: 'A regulated healthcare professional',
        isRegulated: true,
        relatedResources: [],
      };

      const result = await service.createOccupation(dto as any);

      expect(result).toEqual(mockOccupation);
      expect(mockOccupationRepo.create).toHaveBeenCalledWith({
        name: 'Registered Nurse',
        description: 'A regulated healthcare professional',
        isRegulated: true,
        relatedResources: [],
      });
    });

    it('should throw BadRequestException on duplicate name', async () => {
      mockOccupationRepo.findOne.mockResolvedValue(mockOccupation); // duplicate exists

      const dto = { name: 'Registered Nurse' };

      await expect(service.createOccupation(dto as any)).rejects.toThrow(BadRequestException);
    });

    it('should create scope permissions when provided', async () => {
      mockOccupationRepo.findOne.mockResolvedValue(null);
      mockOccupationRepo.create.mockReturnValue(mockOccupation);
      mockOccupationRepo.save.mockResolvedValue(mockOccupation);
      mockAllowedActivityRepo.create.mockReturnValue({});
      mockAllowedActivityRepo.save.mockResolvedValue([]);

      const dto = {
        name: 'New Occupation',
        description: 'Desc',
        isRegulated: true,
        scopePermissions: [
          { careActivityId: 'ca-1', permission: 'Y' },
          { careActivityId: 'ca-2', permission: 'LC' },
        ],
      };

      await service.createOccupation(dto as any);

      expect(mockAllowedActivityRepo.create).toHaveBeenCalledTimes(2);
      expect(mockAllowedActivityRepo.save).toHaveBeenCalled();
    });

    it('should skip scope permissions when not provided', async () => {
      mockOccupationRepo.findOne.mockResolvedValue(null);
      mockOccupationRepo.create.mockReturnValue(mockOccupation);
      mockOccupationRepo.save.mockResolvedValue(mockOccupation);

      const dto = { name: 'New Occupation', description: 'Desc', isRegulated: true };

      await service.createOccupation(dto as any);

      expect(mockAllowedActivityRepo.create).not.toHaveBeenCalled();
      expect(mockAllowedActivityRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('updateOccupationWithScope', () => {
    it('should update occupation fields', async () => {
      mockOccupationRepo.findOneBy.mockResolvedValue({ ...mockOccupation });
      mockOccupationRepo.save.mockResolvedValue(mockOccupation);

      await service.updateOccupationWithScope('occ-1', {
        description: 'Updated description',
      } as any);

      expect(mockOccupationRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when occupation not found', async () => {
      mockOccupationRepo.findOneBy.mockResolvedValue(null);

      await expect(service.updateOccupationWithScope('nonexistent', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException on duplicate name when renaming', async () => {
      const existing = { ...mockOccupation, id: 'occ-2' }; // different ID = duplicate
      mockOccupationRepo.findOneBy.mockResolvedValue({ ...mockOccupation });
      mockOccupationRepo.findOne.mockResolvedValue(existing);
      mockOccupationRepo.save.mockResolvedValue(mockOccupation);

      await expect(
        service.updateOccupationWithScope('occ-1', { name: 'Different Name' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should skip name uniqueness check when name is unchanged', async () => {
      mockOccupationRepo.findOneBy.mockResolvedValue({ ...mockOccupation });
      mockOccupationRepo.save.mockResolvedValue(mockOccupation);

      await service.updateOccupationWithScope('occ-1', {
        name: 'Registered Nurse', // same as existing displayName
      } as any);

      // findOne should not have been called for duplicate check
      expect(mockOccupationRepo.findOne).not.toHaveBeenCalled();
    });

    it('should delete and recreate scope permissions', async () => {
      mockOccupationRepo.findOneBy.mockResolvedValue({ ...mockOccupation });
      mockOccupationRepo.save.mockResolvedValue(mockOccupation);
      mockAllowedActivityRepo.delete.mockResolvedValue({});
      mockAllowedActivityRepo.create.mockReturnValue({});
      mockAllowedActivityRepo.save.mockResolvedValue([]);

      await service.updateOccupationWithScope('occ-1', {
        scopePermissions: [{ careActivityId: 'ca-1', permission: 'Y' }],
      } as any);

      expect(mockAllowedActivityRepo.delete).toHaveBeenCalledWith({
        occupation: { id: 'occ-1' },
      });
      expect(mockAllowedActivityRepo.create).toHaveBeenCalledTimes(1);
      expect(mockAllowedActivityRepo.save).toHaveBeenCalled();
    });

    it('should skip scope permissions update when undefined', async () => {
      mockOccupationRepo.findOneBy.mockResolvedValue({ ...mockOccupation });
      mockOccupationRepo.save.mockResolvedValue(mockOccupation);

      await service.updateOccupationWithScope('occ-1', {
        description: 'Updated',
      } as any);

      expect(mockAllowedActivityRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('updateOccupation', () => {
    it('should find occupation, apply data, and save', async () => {
      const occupation = { ...mockOccupation };
      mockOccupationRepo.findOneBy.mockResolvedValue(occupation);
      mockOccupationRepo.save.mockResolvedValue(occupation);

      await service.updateOccupation('occ-1', {
        description: 'Updated description',
        displayOrder: 5,
      } as any);

      expect(mockOccupationRepo.findOneBy).toHaveBeenCalledWith({ id: 'occ-1' });
      expect(mockOccupationRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Updated description', displayOrder: 5 }),
      );
    });

    it('should throw NotFoundException when id is falsy', async () => {
      await expect(service.updateOccupation('', {} as any)).rejects.toThrow(NotFoundException);

      expect(mockOccupationRepo.findOneBy).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when occupation not found', async () => {
      mockOccupationRepo.findOneBy.mockResolvedValue(null);

      await expect(service.updateOccupation('nonexistent', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteOccupation', () => {
    it('should soft delete the occupation', async () => {
      mockOccupationRepo.findOneBy.mockResolvedValue(mockOccupation);
      mockOccupationRepo.softDelete.mockResolvedValue({});

      await service.deleteOccupation('occ-1');

      expect(mockOccupationRepo.softDelete).toHaveBeenCalledWith('occ-1');
    });

    it('should throw NotFoundException when not found', async () => {
      mockOccupationRepo.findOneBy.mockResolvedValue(null);

      await expect(service.deleteOccupation('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllOccupation', () => {
    it('should return occupations by IDs', async () => {
      mockOccupationRepo.find.mockResolvedValue([mockOccupation]);

      const result = await service.findAllOccupation(['occ-1']);

      expect(result).toEqual([mockOccupation]);
      expect(mockOccupationRepo.find).toHaveBeenCalledWith({
        where: { id: expect.anything() },
      });
    });
  });

  describe('createByDisplayNames', () => {
    it('should batch create occupations from display names', async () => {
      mockOccupationRepo.save.mockResolvedValue([mockOccupation]);

      const result = await service.createByDisplayNames(['Registered Nurse', '"Pharmacist"']);

      expect(result).toEqual([mockOccupation]);
      expect(mockOccupationRepo.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ displayName: 'Registered Nurse', isRegulated: true }),
          expect.objectContaining({ displayName: 'Pharmacist', isRegulated: true }),
        ]),
      );
    });
  });
});
