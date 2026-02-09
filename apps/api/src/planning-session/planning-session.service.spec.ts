import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PlanningSessionService } from './planning-session.service';
import { PlanningSession } from './entity/planning-session.entity';
import { CareActivityService } from '../care-activity/care-activity.service';
import { OccupationService } from '../occupation/occupation.service';
import { UserService } from 'src/user/user.service';
import { CareSettingTemplateService } from 'src/unit/care-setting-template.service';
import {
  CareActivityType,
  PlanningStatus,
  Permissions,
  ActivityGapCareActivity,
} from '@tbcm/common';
import { ActivitiesActionType } from '../common/constants';

describe('PlanningSessionService', () => {
  let service: PlanningSessionService;

  const createMockQueryBuilder = () => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
    getRawOne: jest.fn(),
  });

  let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;

  const mockPlanningSessionRepo = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCareActivityService = {
    getCareActivitiesByBundlesForCareLocation: jest.fn(),
    findAllCareActivities: jest.fn(),
  };

  const mockOccupationService = {
    findAllOccupation: jest.fn(),
  };

  const mockUserService = {
    upsertUserPreference: jest.fn(),
  };

  const mockCareSettingTemplateService = {
    getTemplateForPlanning: jest.fn(),
    getPermissionsForGap: jest.fn(),
    getPermissionsForSuggestions: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockQueryBuilder = createMockQueryBuilder();
    mockPlanningSessionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanningSessionService,
        {
          provide: getRepositoryToken(PlanningSession),
          useValue: mockPlanningSessionRepo,
        },
        {
          provide: CareActivityService,
          useValue: mockCareActivityService,
        },
        {
          provide: OccupationService,
          useValue: mockOccupationService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: CareSettingTemplateService,
          useValue: mockCareSettingTemplateService,
        },
      ],
    }).compile();

    service = module.get<PlanningSessionService>(PlanningSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── findOne ──────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should delegate to planningSessionRepo.findOne', async () => {
      const mockSession = { id: 'session-1' };
      mockPlanningSessionRepo.findOne.mockResolvedValue(mockSession);

      const options = { where: { id: 'session-1' } };
      const result = await service.findOne(options);

      expect(result).toBe(mockSession);
      expect(mockPlanningSessionRepo.findOne).toHaveBeenCalledWith(options);
    });

    it('should return null when session not found', async () => {
      mockPlanningSessionRepo.findOne.mockResolvedValue(null);

      const result = await service.findOne({ where: { id: 'nonexistent' } });

      expect(result).toBeNull();
    });
  });

  // ─── getLastDraftPlanningSession ────────────────────────────────────
  describe('getLastDraftPlanningSession', () => {
    it('should find latest draft session for user', async () => {
      const mockSession = { id: 'session-1', status: PlanningStatus.DRAFT };
      mockPlanningSessionRepo.findOne.mockResolvedValue(mockSession);

      const user = { id: 'user-1' } as any;
      const result = await service.getLastDraftPlanningSession(user);

      expect(result).toBe(mockSession);
      expect(mockPlanningSessionRepo.findOne).toHaveBeenCalledWith({
        where: {
          status: PlanningStatus.DRAFT,
          createdBy: { id: 'user-1' },
        },
        order: { createdAt: -1 },
        relations: ['careLocation', 'careSettingTemplate', 'careActivity', 'careActivity.bundle'],
      });
    });

    it('should return null when no draft exists', async () => {
      mockPlanningSessionRepo.findOne.mockResolvedValue(null);

      const user = { id: 'user-1' } as any;
      const result = await service.getLastDraftPlanningSession(user);

      expect(result).toBeNull();
    });
  });

  // ─── createPlanningSession ──────────────────────────────────────────
  describe('createPlanningSession', () => {
    const mockTemplate = {
      id: 'tmpl-1',
      unit: { id: 'unit-1', displayName: 'ACUTE Care' },
      selectedActivities: [{ id: 'ca-1' }],
    };

    beforeEach(() => {
      mockCareSettingTemplateService.getTemplateForPlanning.mockResolvedValue(mockTemplate);
      mockPlanningSessionRepo.create.mockImplementation((data: any) => ({
        ...data,
        id: 'new-session',
        createdBy: { id: 'user-1' },
      }));
      mockPlanningSessionRepo.save.mockImplementation((data: any) => Promise.resolve(data));
    });

    it('should create session with template, unit, and activities', async () => {
      const dto = {
        profileOption: 'option1',
        careLocation: 'tmpl-1',
      } as any;

      await service.createPlanningSession(dto);

      expect(mockCareSettingTemplateService.getTemplateForPlanning).toHaveBeenCalledWith('tmpl-1');
      expect(mockPlanningSessionRepo.create).toHaveBeenCalledWith({
        profileOption: 'option1',
        careSettingTemplate: mockTemplate,
        careLocation: mockTemplate.unit,
        careActivity: mockTemplate.selectedActivities,
      });
      expect(mockPlanningSessionRepo.save).toHaveBeenCalled();
    });

    it('should save user preference when userPrefNotShowConfirmDraftRemoval is true', async () => {
      const dto = {
        profileOption: 'option1',
        careLocation: 'tmpl-1',
        userPrefNotShowConfirmDraftRemoval: true,
      } as any;

      await service.createPlanningSession(dto);

      expect(mockUserService.upsertUserPreference).toHaveBeenCalledWith('user-1', {
        notShowConfirmDraftRemoval: true,
      });
    });

    it('should not save user preference when flag is not set', async () => {
      const dto = {
        profileOption: 'option1',
        careLocation: 'tmpl-1',
      } as any;

      await service.createPlanningSession(dto);

      expect(mockUserService.upsertUserPreference).not.toHaveBeenCalled();
    });
  });

  // ─── saveProfileSelection ──────────────────────────────────────────
  describe('saveProfileSelection', () => {
    it('should throw NotFoundException when session not found', async () => {
      mockPlanningSessionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.saveProfileSelection('nonexistent', { careLocation: 'tmpl-1' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update template and unit when careLocation changes', async () => {
      const existingSession = {
        id: 'session-1',
        careSettingTemplateId: 'old-tmpl',
        careSettingTemplate: { id: 'old-tmpl' },
      };
      mockPlanningSessionRepo.findOne.mockResolvedValue(existingSession);

      const newTemplate = {
        id: 'new-tmpl',
        unit: { id: 'unit-2' },
        selectedActivities: [{ id: 'ca-2' }],
      };
      mockCareSettingTemplateService.getTemplateForPlanning.mockResolvedValue(newTemplate);
      mockPlanningSessionRepo.save.mockResolvedValue(undefined);

      await service.saveProfileSelection('session-1', { careLocation: 'new-tmpl' } as any);

      expect(mockCareSettingTemplateService.getTemplateForPlanning).toHaveBeenCalledWith(
        'new-tmpl',
      );
      expect(existingSession.careSettingTemplate).toBe(newTemplate);
      expect(mockPlanningSessionRepo.save).toHaveBeenCalled();
    });

    it('should not reload template when careLocation is unchanged', async () => {
      const existingSession = {
        id: 'session-1',
        careSettingTemplateId: 'tmpl-1',
      };
      mockPlanningSessionRepo.findOne.mockResolvedValue(existingSession);
      mockPlanningSessionRepo.save.mockResolvedValue(undefined);

      await service.saveProfileSelection('session-1', { careLocation: 'tmpl-1' } as any);

      expect(mockCareSettingTemplateService.getTemplateForPlanning).not.toHaveBeenCalled();
    });

    it('should update profileOption when provided', async () => {
      const existingSession = {
        id: 'session-1',
        profileOption: 'old',
      };
      mockPlanningSessionRepo.findOne.mockResolvedValue(existingSession);
      mockPlanningSessionRepo.save.mockResolvedValue(undefined);

      await service.saveProfileSelection('session-1', { profileOption: 'new' } as any);

      expect(existingSession.profileOption).toBe('new');
      expect(mockPlanningSessionRepo.save).toHaveBeenCalled();
    });
  });

  // ─── getProfileSelection ──────────────────────────────────────────
  describe('getProfileSelection', () => {
    it('should return templateId as careLocation when present (preferred path)', async () => {
      mockPlanningSessionRepo.findOne.mockResolvedValue({
        id: 'session-1',
        profileOption: 'option1',
        careSettingTemplateId: 'tmpl-1',
        careLocationId: 'unit-1',
      });

      const result = await service.getProfileSelection('session-1');

      expect(result).toEqual({
        profileOption: 'option1',
        careLocation: 'tmpl-1',
      });
    });

    it('should fall back to careLocationId for legacy sessions', async () => {
      mockPlanningSessionRepo.findOne.mockResolvedValue({
        id: 'session-1',
        profileOption: 'option1',
        careSettingTemplateId: undefined,
        careLocationId: 'unit-1',
      });

      const result = await service.getProfileSelection('session-1');

      expect(result).toEqual({
        profileOption: 'option1',
        careLocation: 'unit-1',
      });
    });

    it('should return nulls when session not found', async () => {
      mockPlanningSessionRepo.findOne.mockResolvedValue(null);

      const result = await service.getProfileSelection('nonexistent');

      expect(result).toEqual({
        profileOption: null,
        careLocation: null,
      });
    });
  });

  // ─── getBundlesForSelectedCareLocation ────────────────────────────
  describe('getBundlesForSelectedCareLocation', () => {
    it('should delegate to careActivityService', async () => {
      mockPlanningSessionRepo.findOne.mockResolvedValue({
        id: 'session-1',
        careLocation: { id: 'unit-1' },
      });
      const mockBundles = [{ id: 'b-1', name: 'Bundle 1' }];
      mockCareActivityService.getCareActivitiesByBundlesForCareLocation.mockResolvedValue(
        mockBundles,
      );

      const result = await service.getBundlesForSelectedCareLocation('session-1');

      expect(result).toBe(mockBundles);
      expect(
        mockCareActivityService.getCareActivitiesByBundlesForCareLocation,
      ).toHaveBeenCalledWith('unit-1');
    });

    it('should throw NotFoundException when careLocation is missing', async () => {
      mockPlanningSessionRepo.findOne.mockResolvedValue({
        id: 'session-1',
        careLocation: null,
      });

      await expect(service.getBundlesForSelectedCareLocation('session-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPlanningSessionRepo.findOne.mockResolvedValue(null);

      await expect(service.getBundlesForSelectedCareLocation('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── saveCareActivity ─────────────────────────────────────────────
  describe('saveCareActivity', () => {
    it('should flatten bundle map and save activities', async () => {
      const mockActivities = [{ id: 'ca-1' }, { id: 'ca-2' }, { id: 'ca-3' }];
      mockCareActivityService.findAllCareActivities.mockResolvedValue(mockActivities);
      mockPlanningSessionRepo.findOneBy.mockResolvedValue({ id: 'session-1' });
      mockPlanningSessionRepo.save.mockResolvedValue(undefined);

      await service.saveCareActivity('session-1', {
        careActivityBundle: {
          'b-1': ['ca-1', 'ca-2'],
          'b-2': ['ca-3'],
        },
      } as any);

      expect(mockCareActivityService.findAllCareActivities).toHaveBeenCalledWith([
        'ca-1',
        'ca-2',
        'ca-3',
      ]);
      expect(mockPlanningSessionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'session-1',
          careActivity: mockActivities,
        }),
      );
    });

    it('should return immediately when careActivityBundle is undefined', async () => {
      await service.saveCareActivity('session-1', {} as any);

      expect(mockCareActivityService.findAllCareActivities).not.toHaveBeenCalled();
      expect(mockPlanningSessionRepo.save).not.toHaveBeenCalled();
    });

    it('should set updatedAt to a recent date on save', async () => {
      mockCareActivityService.findAllCareActivities.mockResolvedValue([]);
      mockPlanningSessionRepo.findOneBy.mockResolvedValue({ id: 'session-1' });
      mockPlanningSessionRepo.save.mockResolvedValue(undefined);

      const before = new Date();
      await service.saveCareActivity('session-1', {
        careActivityBundle: { 'b-1': ['ca-1'] },
      } as any);

      const savedArg = mockPlanningSessionRepo.save.mock.calls[0][0];
      expect(savedArg.updatedAt).toBeInstanceOf(Date);
      expect(savedArg.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  // ─── getCareActivity ──────────────────────────────────────────────
  describe('getCareActivity', () => {
    it('should group activities by bundle_id and return map', async () => {
      mockPlanningSessionRepo.findOne.mockResolvedValue({
        id: 'session-1',
        careActivity: [
          { id: 'ca-1', bundle: { id: 'bundle-1' } },
          { id: 'ca-2', bundle: { id: 'bundle-1' } },
          { id: 'ca-3', bundle: { id: 'bundle-2' } },
        ],
      });

      const result = await service.getCareActivity('session-1');

      expect(result).toEqual({
        'bundle-1': ['ca-1', 'ca-2'],
        'bundle-2': ['ca-3'],
      });
    });

    it('should return undefined when session not found', async () => {
      mockPlanningSessionRepo.findOne.mockResolvedValue(null);

      const result = await service.getCareActivity('nonexistent');

      expect(result).toBeUndefined();
    });

    it('should return empty object for empty careActivity array', async () => {
      mockPlanningSessionRepo.findOne.mockResolvedValue({
        id: 'session-1',
        careActivity: [],
      });

      const result = await service.getCareActivity('session-1');

      expect(result).toEqual({});
    });
  });

  // ─── saveOccupation ───────────────────────────────────────────────
  describe('saveOccupation', () => {
    it('should find occupations and save with updatedAt bump', async () => {
      const mockOccupations = [{ id: 'occ-1' }, { id: 'occ-2' }];
      mockOccupationService.findAllOccupation.mockResolvedValue(mockOccupations);
      mockPlanningSessionRepo.findOneBy.mockResolvedValue({ id: 'session-1' });
      mockPlanningSessionRepo.save.mockResolvedValue(undefined);

      await service.saveOccupation('session-1', {
        occupation: ['occ-1', 'occ-2'],
      } as any);

      expect(mockOccupationService.findAllOccupation).toHaveBeenCalledWith(['occ-1', 'occ-2']);
      const savedArg = mockPlanningSessionRepo.save.mock.calls[0][0];
      expect(savedArg.occupation).toBe(mockOccupations);
      expect(savedArg.updatedAt).toBeInstanceOf(Date);
    });
  });

  // ─── getOccupation ────────────────────────────────────────────────
  describe('getOccupation', () => {
    it('should return mapped occupation IDs', async () => {
      mockPlanningSessionRepo.findOne.mockResolvedValue({
        id: 'session-1',
        occupation: [{ id: 'occ-1' }, { id: 'occ-2' }],
      });

      const result = await service.getOccupation('session-1');

      expect(result).toEqual(['occ-1', 'occ-2']);
    });

    it('should return undefined when session not found', async () => {
      mockPlanningSessionRepo.findOne.mockResolvedValue(null);

      const result = await service.getOccupation('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  // ─── getPlanningActivityGap ──────────────────────────────────────────
  describe('getPlanningActivityGap', () => {
    const makeGapSession = (overrides: any = {}) => ({
      id: 'session-1',
      careActivity: [
        {
          id: 'ca-1',
          displayName: 'Activity Alpha',
          bundle: { id: 'b-1', displayName: 'Bundle A' },
        },
      ],
      occupation: [{ id: 'occ-1', displayName: 'Nurse', description: 'RN', displayOrder: 1 }],
      careLocation: { id: 'unit-1', displayName: 'ACUTE Care' },
      careSettingTemplate: { id: 'tmpl-1' },
      careSettingTemplateId: 'tmpl-1',
      ...overrides,
    });

    // ─── Early returns ────────────────────────────────────────────
    describe('early returns', () => {
      it('should return undefined when session not found', async () => {
        mockPlanningSessionRepo.findOne.mockResolvedValue(null);

        const result = await service.getPlanningActivityGap('nonexistent');

        expect(result).toBeUndefined();
      });

      it('should return undefined when no occupations', async () => {
        mockPlanningSessionRepo.findOne.mockResolvedValue(makeGapSession({ occupation: null }));

        const result = await service.getPlanningActivityGap('session-1');

        expect(result).toBeUndefined();
      });

      it('should return undefined when no careActivity', async () => {
        mockPlanningSessionRepo.findOne.mockResolvedValue(makeGapSession({ careActivity: null }));

        const result = await service.getPlanningActivityGap('session-1');

        expect(result).toBeUndefined();
      });
    });

    // ─── Permission paths ─────────────────────────────────────────
    describe('permission paths', () => {
      it('should use getPermissionsForGap for template-based sessions', async () => {
        const session = makeGapSession();
        mockPlanningSessionRepo.findOne.mockResolvedValue(session);
        mockCareSettingTemplateService.getPermissionsForGap.mockResolvedValue([
          { permission: 'Y', care_activity_id: 'ca-1', occupation_id: 'occ-1' },
        ]);

        await service.getPlanningActivityGap('session-1');

        expect(mockCareSettingTemplateService.getPermissionsForGap).toHaveBeenCalledWith(
          'tmpl-1',
          ['ca-1'],
          ['occ-1'],
        );
        expect(mockPlanningSessionRepo.createQueryBuilder).not.toHaveBeenCalled();
      });

      it('should use query builder for legacy sessions', async () => {
        const session = makeGapSession({
          careSettingTemplateId: null,
          careSettingTemplate: null,
        });
        mockPlanningSessionRepo.findOne.mockResolvedValue(session);
        mockQueryBuilder.getRawMany.mockResolvedValue([
          { permission: 'Y', care_activity_id: 'ca-1', occupation_id: 'occ-1' },
        ]);

        await service.getPlanningActivityGap('session-1');

        expect(mockPlanningSessionRepo.createQueryBuilder).toHaveBeenCalledWith('ps');
        expect(mockCareSettingTemplateService.getPermissionsForGap).not.toHaveBeenCalled();
      });
    });

    // ─── Headers ──────────────────────────────────────────────────
    describe('headers', () => {
      it('should start with fixed title then occupations sorted by displayOrder', async () => {
        const session = makeGapSession({
          occupation: [
            { id: 'occ-2', displayName: 'Pharmacist', description: '', displayOrder: 10 },
            { id: 'occ-1', displayName: 'Nurse', description: 'RN', displayOrder: 1 },
            { id: 'occ-3', displayName: 'Aide', description: '', displayOrder: undefined },
          ],
        });
        mockPlanningSessionRepo.findOne.mockResolvedValue(session);
        mockCareSettingTemplateService.getPermissionsForGap.mockResolvedValue([]);

        const result = await service.getPlanningActivityGap('session-1');

        expect(result!.headers[0].title).toBe('Care Competencies and Corresponding Activities');
        expect(result!.headers[1].title).toBe('Nurse');
        expect(result!.headers[2].title).toBe('Pharmacist');
        expect(result!.headers[3].title).toBe('Aide'); // undefined displayOrder → Infinity → last
      });
    });

    // ─── Gap matrix ───────────────────────────────────────────────
    describe('gap matrix', () => {
      it('should mark RED for all occupations when activity has no permissions', async () => {
        const session = makeGapSession();
        mockPlanningSessionRepo.findOne.mockResolvedValue(session);
        mockCareSettingTemplateService.getPermissionsForGap.mockResolvedValue([]); // no permissions

        const result = await service.getPlanningActivityGap('session-1');

        const bundle = result!.data[0];
        expect(bundle.numberOfGaps).toBe(1);
        const activities = bundle.careActivities as ActivityGapCareActivity[];
        expect(activities[0]['Nurse']).toBe(ActivitiesActionType.RED);
      });

      it('should map Y/LC permissions correctly per occupation', async () => {
        const session = makeGapSession({
          occupation: [
            { id: 'occ-1', displayName: 'Nurse', description: '', displayOrder: 1 },
            { id: 'occ-2', displayName: 'Doctor', description: '', displayOrder: 2 },
          ],
        });
        mockPlanningSessionRepo.findOne.mockResolvedValue(session);
        mockCareSettingTemplateService.getPermissionsForGap.mockResolvedValue([
          { permission: 'Y', care_activity_id: 'ca-1', occupation_id: 'occ-1' },
          { permission: 'LC', care_activity_id: 'ca-1', occupation_id: 'occ-2' },
        ]);

        const result = await service.getPlanningActivityGap('session-1');

        const activities = result!.data[0].careActivities as ActivityGapCareActivity[];
        expect(activities[0]['Nurse']).toBe('Y');
        expect(activities[0]['Doctor']).toBe('LC');
      });

      it('should default to RED when permission exists for one occupation but not another', async () => {
        const session = makeGapSession({
          occupation: [
            { id: 'occ-1', displayName: 'Nurse', description: '', displayOrder: 1 },
            { id: 'occ-2', displayName: 'Doctor', description: '', displayOrder: 2 },
          ],
        });
        mockPlanningSessionRepo.findOne.mockResolvedValue(session);
        mockCareSettingTemplateService.getPermissionsForGap.mockResolvedValue([
          { permission: 'Y', care_activity_id: 'ca-1', occupation_id: 'occ-1' },
          // no permission for occ-2
        ]);

        const result = await service.getPlanningActivityGap('session-1');

        const activities = result!.data[0].careActivities as ActivityGapCareActivity[];
        expect(activities[0]['Nurse']).toBe('Y');
        expect(activities[0]['Doctor']).toBe(ActivitiesActionType.RED);
      });
    });

    // ─── Occupation summary ───────────────────────────────────────
    describe('occupation summary', () => {
      it('should use single value when all cells are the same permission', async () => {
        const session = makeGapSession({
          careActivity: [
            {
              id: 'ca-1',
              displayName: 'Activity 1',
              bundle: { id: 'b-1', displayName: 'Bundle A' },
            },
            {
              id: 'ca-2',
              displayName: 'Activity 2',
              bundle: { id: 'b-1', displayName: 'Bundle A' },
            },
          ],
        });
        mockPlanningSessionRepo.findOne.mockResolvedValue(session);
        mockCareSettingTemplateService.getPermissionsForGap.mockResolvedValue([
          { permission: 'Y', care_activity_id: 'ca-1', occupation_id: 'occ-1' },
          { permission: 'Y', care_activity_id: 'ca-2', occupation_id: 'occ-1' },
        ]);

        const result = await service.getPlanningActivityGap('session-1');

        expect(result!.data[0]['Nurse']).toBe('Y');
      });

      it('should use GREY when permissions are mixed', async () => {
        const session = makeGapSession({
          careActivity: [
            {
              id: 'ca-1',
              displayName: 'Activity 1',
              bundle: { id: 'b-1', displayName: 'Bundle A' },
            },
            {
              id: 'ca-2',
              displayName: 'Activity 2',
              bundle: { id: 'b-1', displayName: 'Bundle A' },
            },
          ],
        });
        mockPlanningSessionRepo.findOne.mockResolvedValue(session);
        mockCareSettingTemplateService.getPermissionsForGap.mockResolvedValue([
          { permission: 'Y', care_activity_id: 'ca-1', occupation_id: 'occ-1' },
          // ca-2 has no permission → RED, so mix of Y and RED = GREY
        ]);

        const result = await service.getPlanningActivityGap('session-1');

        expect(result!.data[0]['Nurse']).toBe(ActivitiesActionType.GREY);
      });
    });

    // ─── Overview percentages ─────────────────────────────────────
    describe('overview percentages', () => {
      it('should calculate correct inScope/limits/outOfScope percentages', async () => {
        const session = makeGapSession({
          careActivity: [
            {
              id: 'ca-1',
              displayName: 'Activity 1',
              bundle: { id: 'b-1', displayName: 'Bundle A' },
            },
            {
              id: 'ca-2',
              displayName: 'Activity 2',
              bundle: { id: 'b-1', displayName: 'Bundle A' },
            },
          ],
          occupation: [
            { id: 'occ-1', displayName: 'Nurse', description: '', displayOrder: 1 },
            { id: 'occ-2', displayName: 'Doctor', description: '', displayOrder: 2 },
          ],
        });
        mockPlanningSessionRepo.findOne.mockResolvedValue(session);
        // 4 cells total: 2 Y (PERFORM), 1 LC (LIMITS), 1 missing (out of scope)
        mockCareSettingTemplateService.getPermissionsForGap.mockResolvedValue([
          { permission: 'Y', care_activity_id: 'ca-1', occupation_id: 'occ-1' },
          { permission: 'Y', care_activity_id: 'ca-2', occupation_id: 'occ-1' },
          { permission: 'LC', care_activity_id: 'ca-1', occupation_id: 'occ-2' },
        ]);

        const result = await service.getPlanningActivityGap('session-1');

        expect(result!.overview.inScope).toBe('50%'); // 2/4
        expect(result!.overview.limits).toBe('25%'); // 1/4
        expect(result!.overview.outOfScope).toBe('25%'); // 1 - 50 - 25
      });

      it('should return 100%/0%/0% when all permissions are PERFORM', async () => {
        const session = makeGapSession();
        mockPlanningSessionRepo.findOne.mockResolvedValue(session);
        mockCareSettingTemplateService.getPermissionsForGap.mockResolvedValue([
          { permission: Permissions.PERFORM, care_activity_id: 'ca-1', occupation_id: 'occ-1' },
        ]);

        const result = await service.getPlanningActivityGap('session-1');

        expect(result!.overview.inScope).toBe('100%');
        expect(result!.overview.limits).toBe('0%');
        expect(result!.overview.outOfScope).toBe('0%');
      });

      it('should return 0%/0%/100% when no permissions exist', async () => {
        const session = makeGapSession();
        mockPlanningSessionRepo.findOne.mockResolvedValue(session);
        mockCareSettingTemplateService.getPermissionsForGap.mockResolvedValue([]);

        const result = await service.getPlanningActivityGap('session-1');

        expect(result!.overview.inScope).toBe('0%');
        expect(result!.overview.limits).toBe('0%');
        expect(result!.overview.outOfScope).toBe('100%');
      });
    });

    // ─── Bundle grouping ──────────────────────────────────────────
    describe('bundle grouping', () => {
      it('should group activities by bundle name into separate data entries', async () => {
        const session = makeGapSession({
          careActivity: [
            {
              id: 'ca-1',
              displayName: 'Activity 1',
              bundle: { id: 'b-1', displayName: 'Bundle A' },
            },
            {
              id: 'ca-2',
              displayName: 'Activity 2',
              bundle: { id: 'b-2', displayName: 'Bundle B' },
            },
          ],
        });
        mockPlanningSessionRepo.findOne.mockResolvedValue(session);
        mockCareSettingTemplateService.getPermissionsForGap.mockResolvedValue([]);

        const result = await service.getPlanningActivityGap('session-1');

        expect(result!.data).toHaveLength(2);
        expect(result!.data[0].name).toBe('Bundle A');
        expect(result!.data[1].name).toBe('Bundle B');
      });

      it('should sort result data by bundle name', async () => {
        const session = makeGapSession({
          careActivity: [
            { id: 'ca-1', displayName: 'Activity 1', bundle: { id: 'b-2', displayName: 'Zebra' } },
            { id: 'ca-2', displayName: 'Activity 2', bundle: { id: 'b-1', displayName: 'Alpha' } },
          ],
        });
        mockPlanningSessionRepo.findOne.mockResolvedValue(session);
        mockCareSettingTemplateService.getPermissionsForGap.mockResolvedValue([]);

        const result = await service.getPlanningActivityGap('session-1');

        expect(result!.data[0].name).toBe('Alpha');
        expect(result!.data[1].name).toBe('Zebra');
      });
    });

    // ─── Return shape ─────────────────────────────────────────────
    describe('return shape', () => {
      it('should return careSetting as careLocation.displayName', async () => {
        const session = makeGapSession();
        mockPlanningSessionRepo.findOne.mockResolvedValue(session);
        mockCareSettingTemplateService.getPermissionsForGap.mockResolvedValue([]);

        const result = await service.getPlanningActivityGap('session-1');

        expect(result!.careSetting).toBe('ACUTE Care');
      });
    });
  });

  // ─── getSuggestions ─────────────────────────────────────────────────
  describe('getSuggestions', () => {
    // Helpers to build mock data
    const makeActivity = (
      id: string,
      name: string,
      activityType: CareActivityType,
      bundleId: string,
      bundleName: string,
    ) => ({
      id,
      name,
      displayName: name,
      activityType,
      bundle: { id: bundleId, name: bundleName, displayName: bundleName },
    });

    const makeOccupation = (id: string, name: string) => ({
      id,
      displayName: name,
    });

    const makeSession = (overrides: any = {}) => ({
      id: 'session-1',
      careActivity: [],
      occupation: [],
      careSettingTemplate: { id: 'tmpl-1' },
      careLocation: { id: 'unit-1' },
      ...overrides,
    });

    // ─── Error/empty cases ───────────────────────────────────────────
    describe('error and empty cases', () => {
      it('should throw NotFoundException when session not found', async () => {
        mockPlanningSessionRepo.findOne.mockResolvedValue(null);

        await expect(service.getSuggestions('nonexistent')).rejects.toThrow(NotFoundException);
      });

      it('should return empty with message when no activities selected', async () => {
        mockPlanningSessionRepo.findOne.mockResolvedValue(makeSession({ careActivity: [] }));

        const result = await service.getSuggestions('session-1');

        expect(result.suggestions).toEqual([]);
        expect(result.message).toBe('No care activities selected');
        expect(result.totalUncoveredActivities).toBe(0);
      });

      it('should return empty with message when no care setting selected', async () => {
        mockPlanningSessionRepo.findOne.mockResolvedValue(
          makeSession({
            careActivity: [
              makeActivity('ca-1', 'Activity 1', CareActivityType.TASK, 'b-1', 'Bundle 1'),
            ],
            careSettingTemplate: null,
            careLocation: null,
          }),
        );

        const result = await service.getSuggestions('session-1');

        expect(result.suggestions).toEqual([]);
        expect(result.message).toBe('No care setting selected');
      });

      it('should return empty with message when no permissions found', async () => {
        mockPlanningSessionRepo.findOne.mockResolvedValue(
          makeSession({
            careActivity: [
              makeActivity('ca-1', 'Activity 1', CareActivityType.TASK, 'b-1', 'Bundle 1'),
            ],
          }),
        );
        mockCareSettingTemplateService.getPermissionsForSuggestions.mockResolvedValue([]);

        const result = await service.getSuggestions('session-1');

        expect(result.suggestions).toEqual([]);
        expect(result.message).toBe('No permission data available');
        expect(result.totalUncoveredActivities).toBe(1);
      });
    });

    // ─── Permission paths ──────────────────────────────────────────
    describe('permission paths', () => {
      it('should use CareSettingTemplateService.getPermissionsForSuggestions for template path', async () => {
        const activities = [
          makeActivity('ca-1', 'Activity 1', CareActivityType.TASK, 'b-1', 'Bundle 1'),
        ];
        mockPlanningSessionRepo.findOne.mockResolvedValue(
          makeSession({
            careActivity: activities,
            careSettingTemplate: { id: 'tmpl-1' },
          }),
        );
        mockCareSettingTemplateService.getPermissionsForSuggestions.mockResolvedValue([
          {
            permission: 'Y',
            care_activity_id: 'ca-1',
            occupation_id: 'occ-1',
            occupation_name: 'Nurse',
          },
        ]);

        await service.getSuggestions('session-1');

        expect(mockCareSettingTemplateService.getPermissionsForSuggestions).toHaveBeenCalledWith(
          'tmpl-1',
          ['ca-1'],
        );
        expect(mockPlanningSessionRepo.createQueryBuilder).not.toHaveBeenCalled();
      });

      it('should use planningSessionRepo query builder for legacy path', async () => {
        const activities = [
          makeActivity('ca-1', 'Activity 1', CareActivityType.TASK, 'b-1', 'Bundle 1'),
        ];
        mockPlanningSessionRepo.findOne.mockResolvedValue(
          makeSession({
            careActivity: activities,
            careSettingTemplate: null,
            careLocation: { id: 'unit-1' },
          }),
        );
        mockQueryBuilder.getRawMany.mockResolvedValue([
          {
            permission: 'Y',
            care_activity_id: 'ca-1',
            occupation_id: 'occ-1',
            occupation_name: 'Nurse',
          },
        ]);

        await service.getSuggestions('session-1');

        expect(mockPlanningSessionRepo.createQueryBuilder).toHaveBeenCalledWith('ps');
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('aa.permission IN (:...perms)', {
          perms: ['Y', 'LC'],
        });
        expect(mockCareSettingTemplateService.getPermissionsForSuggestions).not.toHaveBeenCalled();
      });
    });

    // ─── Scoring algorithm ─────────────────────────────────────────
    describe('scoring algorithm', () => {
      const setupScoringTest = (activityType: CareActivityType, permission: string) => {
        const activities = [makeActivity('ca-1', 'Activity 1', activityType, 'b-1', 'Bundle 1')];
        mockPlanningSessionRepo.findOne.mockResolvedValue(
          makeSession({
            careActivity: activities,
            occupation: [],
          }),
        );
        mockCareSettingTemplateService.getPermissionsForSuggestions.mockResolvedValue([
          {
            permission,
            care_activity_id: 'ca-1',
            occupation_id: 'occ-1',
            occupation_name: 'Nurse',
          },
        ]);
      };

      it('should score Restricted Activity + Y as 4', async () => {
        setupScoringTest(CareActivityType.RESTRICTED_ACTIVITY, 'Y');

        const result = await service.getSuggestions('session-1');

        expect(result.suggestions[0].score).toBe(4);
      });

      it('should score Restricted Activity + LC as 3', async () => {
        setupScoringTest(CareActivityType.RESTRICTED_ACTIVITY, 'LC');

        const result = await service.getSuggestions('session-1');

        expect(result.suggestions[0].score).toBe(3);
      });

      it('should score Aspect of Practice + Y as 3', async () => {
        setupScoringTest(CareActivityType.ASPECT_OF_PRACTICE, 'Y');

        const result = await service.getSuggestions('session-1');

        expect(result.suggestions[0].score).toBe(3);
      });

      it('should score Aspect of Practice + LC as 2', async () => {
        setupScoringTest(CareActivityType.ASPECT_OF_PRACTICE, 'LC');

        const result = await service.getSuggestions('session-1');

        expect(result.suggestions[0].score).toBe(2);
      });

      it('should score Task + Y as 2', async () => {
        setupScoringTest(CareActivityType.TASK, 'Y');

        const result = await service.getSuggestions('session-1');

        expect(result.suggestions[0].score).toBe(2);
      });

      it('should score Task + LC as 1', async () => {
        setupScoringTest(CareActivityType.TASK, 'LC');

        const result = await service.getSuggestions('session-1');

        expect(result.suggestions[0].score).toBe(1);
      });
    });

    // ─── Exclusion ─────────────────────────────────────────────────
    describe('occupation exclusion', () => {
      // Two activities: ca-1 will be covered by excluded occ, ca-2 stays uncovered
      const activities = [
        makeActivity('ca-1', 'Activity 1', CareActivityType.TASK, 'b-1', 'Bundle 1'),
        makeActivity('ca-2', 'Activity 2', CareActivityType.TASK, 'b-1', 'Bundle 1'),
      ];

      it('should exclude session occupations from suggestions', async () => {
        mockPlanningSessionRepo.findOne.mockResolvedValue(
          makeSession({
            careActivity: activities,
            occupation: [makeOccupation('occ-1', 'Nurse')],
          }),
        );
        mockCareSettingTemplateService.getPermissionsForSuggestions.mockResolvedValue([
          // occ-1 (excluded) covers ca-1 only
          {
            permission: 'Y',
            care_activity_id: 'ca-1',
            occupation_id: 'occ-1',
            occupation_name: 'Nurse',
          },
          // occ-2 covers ca-2 (uncovered), so it can score
          {
            permission: 'Y',
            care_activity_id: 'ca-2',
            occupation_id: 'occ-2',
            occupation_name: 'Pharmacist',
          },
        ]);

        const result = await service.getSuggestions('session-1');

        const ids = result.suggestions.map(s => s.occupationId);
        expect(ids).not.toContain('occ-1');
        expect(ids).toContain('occ-2');
      });

      it('should exclude tempSelectedIds from suggestions', async () => {
        mockPlanningSessionRepo.findOne.mockResolvedValue(
          makeSession({
            careActivity: activities,
            occupation: [],
          }),
        );
        mockCareSettingTemplateService.getPermissionsForSuggestions.mockResolvedValue([
          // occ-1 (temp-excluded) covers ca-1
          {
            permission: 'Y',
            care_activity_id: 'ca-1',
            occupation_id: 'occ-1',
            occupation_name: 'Nurse',
          },
          // occ-2 covers ca-2 (uncovered)
          {
            permission: 'Y',
            care_activity_id: 'ca-2',
            occupation_id: 'occ-2',
            occupation_name: 'Pharmacist',
          },
        ]);

        const result = await service.getSuggestions('session-1', ['occ-1']);

        const ids = result.suggestions.map(s => s.occupationId);
        expect(ids).not.toContain('occ-1');
        expect(ids).toContain('occ-2');
      });

      it('should exclude both session occupations and tempSelectedIds', async () => {
        const threeActivities = [
          ...activities,
          makeActivity('ca-3', 'Activity 3', CareActivityType.TASK, 'b-1', 'Bundle 1'),
        ];
        mockPlanningSessionRepo.findOne.mockResolvedValue(
          makeSession({
            careActivity: threeActivities,
            occupation: [makeOccupation('occ-1', 'Nurse')],
          }),
        );
        mockCareSettingTemplateService.getPermissionsForSuggestions.mockResolvedValue([
          // occ-1 (session-excluded) covers ca-1
          {
            permission: 'Y',
            care_activity_id: 'ca-1',
            occupation_id: 'occ-1',
            occupation_name: 'Nurse',
          },
          // occ-2 (temp-excluded) covers ca-2
          {
            permission: 'Y',
            care_activity_id: 'ca-2',
            occupation_id: 'occ-2',
            occupation_name: 'Pharmacist',
          },
          // occ-3 covers ca-3 (uncovered by either exclusion)
          {
            permission: 'Y',
            care_activity_id: 'ca-3',
            occupation_id: 'occ-3',
            occupation_name: 'Doctor',
          },
        ]);

        const result = await service.getSuggestions('session-1', ['occ-2']);

        const ids = result.suggestions.map(s => s.occupationId);
        expect(ids).not.toContain('occ-1');
        expect(ids).not.toContain('occ-2');
        expect(ids).toContain('occ-3');
      });
    });

    // ─── Coverage tracking ─────────────────────────────────────────
    describe('coverage tracking', () => {
      it('should mark activities as covered when excluded occupations have permissions', async () => {
        const activities = [
          makeActivity('ca-1', 'Activity 1', CareActivityType.TASK, 'b-1', 'Bundle 1'),
          makeActivity('ca-2', 'Activity 2', CareActivityType.TASK, 'b-1', 'Bundle 1'),
        ];
        mockPlanningSessionRepo.findOne.mockResolvedValue(
          makeSession({
            careActivity: activities,
            occupation: [makeOccupation('occ-1', 'Nurse')],
          }),
        );
        // occ-1 (excluded) covers ca-1; occ-2 has permissions for both
        mockCareSettingTemplateService.getPermissionsForSuggestions.mockResolvedValue([
          {
            permission: 'Y',
            care_activity_id: 'ca-1',
            occupation_id: 'occ-1',
            occupation_name: 'Nurse',
          },
          {
            permission: 'Y',
            care_activity_id: 'ca-1',
            occupation_id: 'occ-2',
            occupation_name: 'Pharmacist',
          },
          {
            permission: 'Y',
            care_activity_id: 'ca-2',
            occupation_id: 'occ-2',
            occupation_name: 'Pharmacist',
          },
        ]);

        const result = await service.getSuggestions('session-1');

        // ca-1 is covered by occ-1, so only ca-2 is uncovered
        expect(result.totalUncoveredActivities).toBe(1);
      });

      it('should only score uncovered activities', async () => {
        const activities = [
          makeActivity('ca-1', 'Activity 1', CareActivityType.TASK, 'b-1', 'Bundle 1'),
          makeActivity('ca-2', 'Activity 2', CareActivityType.TASK, 'b-1', 'Bundle 1'),
        ];
        mockPlanningSessionRepo.findOne.mockResolvedValue(
          makeSession({
            careActivity: activities,
            occupation: [makeOccupation('occ-1', 'Nurse')],
          }),
        );
        // occ-1 covers ca-1; occ-2 has Y for both ca-1 and ca-2
        mockCareSettingTemplateService.getPermissionsForSuggestions.mockResolvedValue([
          {
            permission: 'Y',
            care_activity_id: 'ca-1',
            occupation_id: 'occ-1',
            occupation_name: 'Nurse',
          },
          {
            permission: 'Y',
            care_activity_id: 'ca-1',
            occupation_id: 'occ-2',
            occupation_name: 'Pharmacist',
          },
          {
            permission: 'Y',
            care_activity_id: 'ca-2',
            occupation_id: 'occ-2',
            occupation_name: 'Pharmacist',
          },
        ]);

        const result = await service.getSuggestions('session-1');

        // occ-2 should only score for ca-2 (uncovered), not ca-1 (covered by occ-1)
        // Task + Y = 2 (only ca-2)
        expect(result.suggestions[0].score).toBe(2);
      });
    });

    // ─── Aggregation and sorting ───────────────────────────────────
    describe('aggregation and sorting', () => {
      it('should sum scores across multiple activities per occupation', async () => {
        const activities = [
          makeActivity(
            'ca-1',
            'Activity 1',
            CareActivityType.RESTRICTED_ACTIVITY,
            'b-1',
            'Bundle 1',
          ),
          makeActivity('ca-2', 'Activity 2', CareActivityType.TASK, 'b-1', 'Bundle 1'),
        ];
        mockPlanningSessionRepo.findOne.mockResolvedValue(
          makeSession({ careActivity: activities, occupation: [] }),
        );
        mockCareSettingTemplateService.getPermissionsForSuggestions.mockResolvedValue([
          {
            permission: 'Y',
            care_activity_id: 'ca-1',
            occupation_id: 'occ-1',
            occupation_name: 'Nurse',
          },
          {
            permission: 'Y',
            care_activity_id: 'ca-2',
            occupation_id: 'occ-1',
            occupation_name: 'Nurse',
          },
        ]);

        const result = await service.getSuggestions('session-1');

        // Restricted+Y=4 + Task+Y=2 = 6
        expect(result.suggestions[0].score).toBe(6);
      });

      it('should sort by score DESC then name ASC', async () => {
        const activities = [
          makeActivity('ca-1', 'Activity 1', CareActivityType.TASK, 'b-1', 'Bundle 1'),
          makeActivity(
            'ca-2',
            'Activity 2',
            CareActivityType.RESTRICTED_ACTIVITY,
            'b-1',
            'Bundle 1',
          ),
        ];
        mockPlanningSessionRepo.findOne.mockResolvedValue(
          makeSession({ careActivity: activities, occupation: [] }),
        );
        mockCareSettingTemplateService.getPermissionsForSuggestions.mockResolvedValue([
          // occ-1 (Nurse): Task+Y=2
          {
            permission: 'Y',
            care_activity_id: 'ca-1',
            occupation_id: 'occ-1',
            occupation_name: 'Nurse',
          },
          // occ-2 (Doctor): Restricted+Y=4
          {
            permission: 'Y',
            care_activity_id: 'ca-2',
            occupation_id: 'occ-2',
            occupation_name: 'Doctor',
          },
          // occ-3 (Aide): Task+Y=2 (same score as Nurse, but "Aide" < "Nurse" alphabetically)
          {
            permission: 'Y',
            care_activity_id: 'ca-1',
            occupation_id: 'occ-3',
            occupation_name: 'Aide',
          },
        ]);

        const result = await service.getSuggestions('session-1');

        expect(result.suggestions[0].occupationName).toBe('Doctor'); // score 4
        expect(result.suggestions[1].occupationName).toBe('Aide'); // score 2, name ASC
        expect(result.suggestions[2].occupationName).toBe('Nurse'); // score 2, name ASC
      });

      it('should exclude zero-score occupations', async () => {
        const activities = [
          makeActivity('ca-1', 'Activity 1', CareActivityType.TASK, 'b-1', 'Bundle 1'),
        ];
        mockPlanningSessionRepo.findOne.mockResolvedValue(
          makeSession({ careActivity: activities, occupation: [] }),
        );
        // occ-1 has Y for ca-1, occ-2 has no permission for ca-1 (not in results)
        mockCareSettingTemplateService.getPermissionsForSuggestions.mockResolvedValue([
          {
            permission: 'Y',
            care_activity_id: 'ca-1',
            occupation_id: 'occ-1',
            occupation_name: 'Nurse',
          },
        ]);

        const result = await service.getSuggestions('session-1');

        expect(result.suggestions).toHaveLength(1);
        expect(result.suggestions[0].occupationId).toBe('occ-1');
      });
    });

    // ─── Pagination ────────────────────────────────────────────────
    describe('pagination', () => {
      const setupPaginationTest = () => {
        const activities = [
          makeActivity('ca-1', 'Activity 1', CareActivityType.TASK, 'b-1', 'Bundle 1'),
        ];
        mockPlanningSessionRepo.findOne.mockResolvedValue(
          makeSession({ careActivity: activities, occupation: [] }),
        );
        // Create 3 occupations
        mockCareSettingTemplateService.getPermissionsForSuggestions.mockResolvedValue([
          {
            permission: 'Y',
            care_activity_id: 'ca-1',
            occupation_id: 'occ-1',
            occupation_name: 'Alpha',
          },
          {
            permission: 'Y',
            care_activity_id: 'ca-1',
            occupation_id: 'occ-2',
            occupation_name: 'Beta',
          },
          {
            permission: 'Y',
            care_activity_id: 'ca-1',
            occupation_id: 'occ-3',
            occupation_name: 'Charlie',
          },
        ]);
      };

      it('should return correct page slice', async () => {
        setupPaginationTest();

        const result = await service.getSuggestions('session-1', [], 1, 2);

        expect(result.suggestions).toHaveLength(2);
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(2);
      });

      it('should return total count across all pages', async () => {
        setupPaginationTest();

        const result = await service.getSuggestions('session-1', [], 1, 2);

        expect(result.total).toBe(3);
      });

      it('should return empty when page is beyond results', async () => {
        setupPaginationTest();

        const result = await service.getSuggestions('session-1', [], 10, 2);

        expect(result.suggestions).toHaveLength(0);
        expect(result.total).toBe(3);
      });
    });

    // ─── Competency grouping ───────────────────────────────────────
    describe('competency grouping', () => {
      it('should group activities by bundle', async () => {
        const activities = [
          makeActivity('ca-1', 'Activity 1', CareActivityType.TASK, 'b-1', 'Bundle A'),
          makeActivity('ca-2', 'Activity 2', CareActivityType.TASK, 'b-2', 'Bundle B'),
        ];
        mockPlanningSessionRepo.findOne.mockResolvedValue(
          makeSession({ careActivity: activities, occupation: [] }),
        );
        mockCareSettingTemplateService.getPermissionsForSuggestions.mockResolvedValue([
          {
            permission: 'Y',
            care_activity_id: 'ca-1',
            occupation_id: 'occ-1',
            occupation_name: 'Nurse',
          },
          {
            permission: 'Y',
            care_activity_id: 'ca-2',
            occupation_id: 'occ-1',
            occupation_name: 'Nurse',
          },
        ]);

        const result = await service.getSuggestions('session-1');

        const competencies = result.suggestions[0].competencies;
        expect(competencies).toHaveLength(2);
        expect(competencies[0].bundleName).toBe('Bundle A');
        expect(competencies[1].bundleName).toBe('Bundle B');
      });

      it('should separate Y and LC activities within each bundle', async () => {
        const activities = [
          makeActivity('ca-1', 'Y Activity', CareActivityType.TASK, 'b-1', 'Bundle 1'),
          makeActivity('ca-2', 'LC Activity', CareActivityType.TASK, 'b-1', 'Bundle 1'),
        ];
        mockPlanningSessionRepo.findOne.mockResolvedValue(
          makeSession({ careActivity: activities, occupation: [] }),
        );
        mockCareSettingTemplateService.getPermissionsForSuggestions.mockResolvedValue([
          {
            permission: 'Y',
            care_activity_id: 'ca-1',
            occupation_id: 'occ-1',
            occupation_name: 'Nurse',
          },
          {
            permission: 'LC',
            care_activity_id: 'ca-2',
            occupation_id: 'occ-1',
            occupation_name: 'Nurse',
          },
        ]);

        const result = await service.getSuggestions('session-1');

        const competency = result.suggestions[0].competencies[0];
        expect(competency.activitiesY).toHaveLength(1);
        expect(competency.activitiesY[0].activityName).toBe('Y Activity');
        expect(competency.activitiesLC).toHaveLength(1);
        expect(competency.activitiesLC[0].activityName).toBe('LC Activity');
      });

      it('should sort competencies by bundleName', async () => {
        const activities = [
          makeActivity('ca-1', 'Activity 1', CareActivityType.TASK, 'b-2', 'Zebra Bundle'),
          makeActivity('ca-2', 'Activity 2', CareActivityType.TASK, 'b-1', 'Alpha Bundle'),
        ];
        mockPlanningSessionRepo.findOne.mockResolvedValue(
          makeSession({ careActivity: activities, occupation: [] }),
        );
        mockCareSettingTemplateService.getPermissionsForSuggestions.mockResolvedValue([
          {
            permission: 'Y',
            care_activity_id: 'ca-1',
            occupation_id: 'occ-1',
            occupation_name: 'Nurse',
          },
          {
            permission: 'Y',
            care_activity_id: 'ca-2',
            occupation_id: 'occ-1',
            occupation_name: 'Nurse',
          },
        ]);

        const result = await service.getSuggestions('session-1');

        const competencies = result.suggestions[0].competencies;
        expect(competencies[0].bundleName).toBe('Alpha Bundle');
        expect(competencies[1].bundleName).toBe('Zebra Bundle');
      });

      it('should use displayName not cleaned name for activities and bundles', async () => {
        const activities = [
          {
            id: 'ca-1',
            name: 'cleanedname',
            displayName: 'Proper Display Name',
            activityType: CareActivityType.TASK,
            bundle: { id: 'b-1', name: 'cleanedbundle', displayName: 'Proper Bundle Name' },
          },
        ];
        mockPlanningSessionRepo.findOne.mockResolvedValue(
          makeSession({ careActivity: activities, occupation: [] }),
        );
        mockCareSettingTemplateService.getPermissionsForSuggestions.mockResolvedValue([
          {
            permission: 'Y',
            care_activity_id: 'ca-1',
            occupation_id: 'occ-1',
            occupation_name: 'Nurse',
          },
        ]);

        const result = await service.getSuggestions('session-1');

        const competency = result.suggestions[0].competencies[0];
        expect(competency.activitiesY[0].activityName).toBe('Proper Display Name');
        expect(competency.bundleName).toBe('Proper Bundle Name');
      });
    });
  });
});
