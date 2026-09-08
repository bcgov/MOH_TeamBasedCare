import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CareActivityService } from './care-activity.service';
import { Bundle } from './entity/bundle.entity';
import { CareActivity } from './entity/care-activity.entity';
import { AllowedActivity } from '../allowed-activity/entity/allowed-activity.entity';
import { CareActivitySearchTerm } from './entity/care-activity-search-term.entity';
import { UnitService } from '../unit/unit.service';
import { OccupationService } from '../occupation/occupation.service';
import { CareActivityType, EditCareActivityCMSDTO } from '@tbcm/common';

describe('CareActivityService CMS details', () => {
  let service: CareActivityService;

  const mockBundleRepo = {
    findOneBy: jest.fn(),
  };

  const mockCareActivityRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
    manager: {
      query: jest.fn(),
    },
  };

  const mockAllowedActivityRepo = {};
  const mockCareActivitySearchTermRepo = {};
  const mockUnitService = {};
  const mockOccupationService = {};

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CareActivityService,
        {
          provide: getRepositoryToken(Bundle),
          useValue: mockBundleRepo,
        },
        {
          provide: getRepositoryToken(CareActivity),
          useValue: mockCareActivityRepo,
        },
        {
          provide: getRepositoryToken(AllowedActivity),
          useValue: mockAllowedActivityRepo,
        },
        {
          provide: getRepositoryToken(CareActivitySearchTerm),
          useValue: mockCareActivitySearchTermRepo,
        },
        {
          provide: UnitService,
          useValue: mockUnitService,
        },
        {
          provide: OccupationService,
          useValue: mockOccupationService,
        },
      ],
    }).compile();

    service = module.get<CareActivityService>(CareActivityService);
  });

  it('loads requirements and considerations with the CMS detail data', async () => {
    const careActivity = {
      id: 'activity-1',
      displayName: 'Administer medications',
      description: 'Medication description',
      requirementsAndConsiderations: 'Medication requirements',
      bundle: {
        id: 'bundle-1',
        displayName: 'Medication management',
        careActivities: [],
      },
    };

    mockCareActivityRepo.findOne.mockResolvedValue(careActivity);
    mockCareActivityRepo.manager.query.mockResolvedValue([{ template_names: 'Acute Care' }]);

    const result = await service.getCareActivityByIdCMS(careActivity.id);

    expect(mockCareActivityRepo.findOne).toHaveBeenCalledWith({
      where: { id: careActivity.id },
      relations: ['bundle', 'bundle.careActivities'],
    });
    expect(result.entity.requirementsAndConsiderations).toBe('Medication requirements');
    expect(result.templateNames).toBe('Acute Care');
  });

  it('persists requirements and considerations through the CMS update', async () => {
    const careActivity = {
      id: 'activity-1',
      bundle: { id: 'bundle-1' },
    };
    const update: EditCareActivityCMSDTO = {
      name: 'Administer medications',
      description: 'Medication description',
      requirementsAndConsiderations: 'Updated medication requirements',
      bundleId: 'bundle-1',
      activityType: CareActivityType.ASPECT_OF_PRACTICE,
    };

    mockCareActivityRepo.findOne.mockResolvedValue(careActivity);

    await service.updateCareActivityCMS(careActivity.id, update);

    expect(mockCareActivityRepo.update).toHaveBeenCalledWith(
      careActivity.id,
      expect.objectContaining({
        description: update.description,
        requirementsAndConsiderations: update.requirementsAndConsiderations,
      }),
    );
    expect(mockBundleRepo.findOneBy).not.toHaveBeenCalled();
  });
});
