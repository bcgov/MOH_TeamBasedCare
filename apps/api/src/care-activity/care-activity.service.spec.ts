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
    createQueryBuilder: jest.fn(),
    manager: {
      query: jest.fn(),
    },
  };

  const mockAllowedActivityRepo = {};
  const mockCareActivitySearchTermRepo = {
    create: jest.fn(term => term),
    save: jest.fn().mockResolvedValue(undefined),
  };
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

  it('paginates CMS care activities in the database and returns the full count', async () => {
    const rawActivity = {
      ca_id: 'activity-1',
      ca_display_name: 'Administer medications',
      ca_activity_type: CareActivityType.ASPECT_OF_PRACTICE,
      ca_clinical_type: null,
      ca_b_display_name: 'Medication management',
      ca_up_display_name: 'Test User',
      template_names: 'Acute Care',
    };
    const queryBuilder: Record<string, jest.Mock> = {
      getCount: jest.fn().mockResolvedValue(27),
      getRawMany: jest.fn().mockResolvedValue([rawActivity]),
    };

    for (const method of [
      'leftJoin',
      'select',
      'addSelect',
      'groupBy',
      'addGroupBy',
      'andWhere',
      'orderBy',
      'limit',
      'offset',
    ]) {
      queryBuilder[method] = jest.fn(() => queryBuilder);
    }

    mockCareActivityRepo.createQueryBuilder.mockReturnValue(queryBuilder);

    const [activities, count] = await service.findCareActivitiesCMS(
      { page: 3, pageSize: 10 },
      null,
    );

    expect(queryBuilder.limit).toHaveBeenCalledWith(10);
    expect(queryBuilder.offset).toHaveBeenCalledWith(20);
    expect(queryBuilder.getCount).toHaveBeenCalled();
    expect(queryBuilder.getRawMany).toHaveBeenCalled();
    expect(activities).toEqual([
      {
        id: rawActivity.ca_id,
        name: rawActivity.ca_display_name,
        activityType: rawActivity.ca_activity_type,
        clinicalType: rawActivity.ca_clinical_type,
        bundleName: rawActivity.ca_b_display_name,
        updatedBy: rawActivity.ca_up_display_name,
        unitName: rawActivity.template_names,
        unitId: '',
      },
    ]);
    expect(count).toBe(27);
  });

  describe('findCareActivities care setting filter', () => {
    const buildQueryBuilder = () => {
      const queryBuilder: Record<string, jest.Mock> = {
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      for (const method of ['leftJoinAndSelect', 'where', 'andWhere', 'orderBy', 'skip', 'take']) {
        queryBuilder[method] = jest.fn(() => queryBuilder);
      }

      return queryBuilder;
    };

    it('narrows results to visible templates and the selected care setting', async () => {
      const queryBuilder = buildQueryBuilder();
      mockCareActivityRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.findCareActivities(
        {
          page: 1,
          pageSize: 10,
          careSetting: 'a1f1b2a0-0000-4000-8000-000000000000',
        },
        'HEALTH_AUTHORITY',
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(2);
      const [visibilityClause, visibilityParams] = queryBuilder.andWhere.mock.calls[0];
      expect(visibilityClause).toContain('care_setting_template_activities');
      expect(visibilityClause).toContain("cst.health_authority = 'GLOBAL'");
      expect(visibilityParams).toEqual({ healthAuthority: 'HEALTH_AUTHORITY' });

      // Subqueries avoid multiplying rows and corrupting pagination counts.
      const [filterClause, filterParams] = queryBuilder.andWhere.mock.calls[1];
      expect(filterClause).toContain(':careSettingTemplateId');
      expect(filterClause).toContain("cst.health_authority = 'GLOBAL'");
      expect(filterParams).toEqual({
        careSettingTemplateId: 'a1f1b2a0-0000-4000-8000-000000000000',
        healthAuthority: 'HEALTH_AUTHORITY',
      });
      expect(queryBuilder.where).not.toHaveBeenCalled();
    });

    it('combines the care setting filter with the search text', async () => {
      const queryBuilder = buildQueryBuilder();
      mockCareActivityRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.findCareActivities(
        {
          page: 1,
          pageSize: 10,
          searchText: 'Screen',
          careSetting: 'a1f1b2a0-0000-4000-8000-000000000000',
        },
        'HEALTH_AUTHORITY',
      );

      // both filters have to be `andWhere`, otherwise the second one replaces the first
      expect(queryBuilder.where).not.toHaveBeenCalled();
      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(3);
      expect(queryBuilder.andWhere.mock.calls[0][0]).toContain('cst.health_authority');
      expect(queryBuilder.andWhere.mock.calls[1][0]).toContain('ca.displayName ILIKE');
      expect(queryBuilder.andWhere.mock.calls[2][0]).toContain('care_setting_template_activities');
    });

    it('does not filter when no care setting is selected', async () => {
      const queryBuilder = buildQueryBuilder();
      mockCareActivityRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.findCareActivities({ page: 1, pageSize: 10, careSetting: '' }, null);

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1);
      expect(queryBuilder.andWhere.mock.calls[0][0]).toContain('WHERE TRUE');
      expect(queryBuilder.andWhere.mock.calls[0][1]).toEqual({});
      expect(queryBuilder.where).not.toHaveBeenCalled();
    });

    it('does not bind a null health authority for admins', async () => {
      const queryBuilder = buildQueryBuilder();
      mockCareActivityRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.findCareActivities(
        {
          page: 1,
          pageSize: 10,
          careSetting: 'a1f1b2a0-0000-4000-8000-000000000000',
        },
        null,
      );

      expect(queryBuilder.andWhere.mock.calls[0][0]).toContain('WHERE TRUE');
      expect(queryBuilder.andWhere.mock.calls[0][1]).toEqual({});
      expect(queryBuilder.andWhere.mock.calls[1][0]).toContain('cst.id = :careSettingTemplateId');
      expect(queryBuilder.andWhere.mock.calls[1][1]).toEqual({
        careSettingTemplateId: 'a1f1b2a0-0000-4000-8000-000000000000',
      });
      expect(JSON.stringify(queryBuilder.andWhere.mock.calls)).not.toContain('null');
    });

    it('returns visible care setting names for the paged activities', async () => {
      const activity = { id: 'activity-1', displayName: 'Take vital signs' } as CareActivity;
      const queryBuilder = buildQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([[activity], 1]);
      mockCareActivityRepo.createQueryBuilder.mockReturnValue(queryBuilder);
      mockCareActivityRepo.manager.query.mockResolvedValue([
        {
          care_activity_id: 'activity-1',
          care_setting_names: ['Emergency Department', 'Medical Unit'],
        },
      ]);

      const [activities] = await service.findCareActivities(
        { page: 1, pageSize: 10 },
        'HEALTH_AUTHORITY',
      );

      expect(mockCareActivityRepo.manager.query).toHaveBeenCalledWith(
        expect.stringContaining('cst.health_authority = $2'),
        [['activity-1'], 'HEALTH_AUTHORITY', expect.any(String)],
      );
      expect(activities[0].careSettingNames).toEqual(['Emergency Department', 'Medical Unit']);
    });
  });
});
