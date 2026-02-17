import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { CareActivityBulkService } from './care-activity-bulk.service';
import { CareActivity } from './entity/care-activity.entity';
import { OccupationService } from '../occupation/occupation.service';
import { UnitService } from '../unit/unit.service';
import { BundleService } from './bundle.service';
import { AllowedActivityService } from '../allowed-activity/allowed-activity.service';
import { CareSettingTemplateService } from '../unit/care-setting-template.service';
import { BULK_UPLOAD_COLUMNS, CareActivityType, DuplicateHandling } from '@tbcm/common';

describe('CareActivityBulkService', () => {
  let service: CareActivityBulkService;

  // Mock repositories and services
  const mockCareActivityRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn().mockImplementation(() => ({}) as any), // Return empty object for new entities
    save: jest.fn(),
    manager: {
      transaction: jest.fn(),
    },
  };

  const mockOccupationService = {
    getAllOccupations: jest.fn(),
    createByDisplayNames: jest.fn(),
  };

  const mockUnitService = {
    saveCareLocations: jest.fn(),
    getAllUnits: jest.fn(),
    getUnitsByNames: jest.fn(),
  };

  const mockBundleService = {
    upsertBundles: jest.fn(),
    getManyByNames: jest.fn(),
  };

  const mockAllowedActivityService = {
    upsertAllowedActivities: jest.fn(),
    removeAllowedActivities: jest.fn(),
  };

  const mockCareSettingTemplateService = {
    findOrCreateMasterTemplates: jest.fn().mockResolvedValue(new Map()),
    syncBulkUploadToTemplates: jest.fn().mockResolvedValue(undefined),
  };

  // Test data factories
  const createMockOccupation = (overrides = {}) => ({
    id: 'occ-1',
    name: 'registerednurse',
    displayName: 'Registered Nurse',
    ...overrides,
  });

  const createMockCareActivity = (overrides = {}) => ({
    id: 'ca-1',
    name: 'testactivity',
    displayName: 'Test Activity',
    activityType: CareActivityType.TASK,
    ...overrides,
  });

  const createValidBulkData = (overrides: Partial<Record<string, string>> = {}) => ({
    rowData: {
      [BULK_UPLOAD_COLUMNS.ID]: '',
      [BULK_UPLOAD_COLUMNS.CARE_SETTING]: 'Test Setting',
      [BULK_UPLOAD_COLUMNS.CARE_BUNDLE]: 'Test Bundle',
      [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'Test Activity',
      [BULK_UPLOAD_COLUMNS.ASPECT_OF_PRACTICE]: CareActivityType.TASK,
      'Registered Nurse': 'Y',
      ...overrides,
    },
    rowNumber: 2,
  });

  const createValidHeaders = () => [
    BULK_UPLOAD_COLUMNS.ID,
    BULK_UPLOAD_COLUMNS.CARE_SETTING,
    BULK_UPLOAD_COLUMNS.CARE_BUNDLE,
    BULK_UPLOAD_COLUMNS.CARE_ACTIVITY,
    BULK_UPLOAD_COLUMNS.ASPECT_OF_PRACTICE,
    'Registered Nurse',
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CareActivityBulkService,
        {
          provide: getRepositoryToken(CareActivity),
          useValue: mockCareActivityRepo,
        },
        {
          provide: OccupationService,
          useValue: mockOccupationService,
        },
        {
          provide: UnitService,
          useValue: mockUnitService,
        },
        {
          provide: BundleService,
          useValue: mockBundleService,
        },
        {
          provide: AllowedActivityService,
          useValue: mockAllowedActivityService,
        },
        {
          provide: CareSettingTemplateService,
          useValue: mockCareSettingTemplateService,
        },
      ],
    }).compile();

    service = module.get<CareActivityBulkService>(CareActivityBulkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCareActivitiesBulk', () => {
    it('should return missingOccupations info with specific names (not in errors)', async () => {
      // Arrange: DB has occupations that are NOT in headers
      const dbOccupations = [
        createMockOccupation({ displayName: 'Registered Nurse' }),
        createMockOccupation({ id: 'occ-2', displayName: 'Licensed Practical Nurse' }),
        createMockOccupation({ id: 'occ-3', displayName: 'Pharmacist' }),
      ];
      mockOccupationService.getAllOccupations.mockResolvedValue(dbOccupations);
      mockCareActivityRepo.find.mockResolvedValue([]);

      // Headers only have "Registered Nurse", missing LPN and Pharmacist
      const headers = [
        BULK_UPLOAD_COLUMNS.ID,
        BULK_UPLOAD_COLUMNS.CARE_SETTING,
        BULK_UPLOAD_COLUMNS.CARE_BUNDLE,
        BULK_UPLOAD_COLUMNS.CARE_ACTIVITY,
        BULK_UPLOAD_COLUMNS.ASPECT_OF_PRACTICE,
        'Registered Nurse',
      ];

      const dto = {
        headers,
        data: [createValidBulkData()],
      };

      // Act
      const result = await service.validateCareActivitiesBulk(dto);

      // Assert: Missing occupations should be in info field (not errors) with specific names
      expect(result.errors).toHaveLength(0);
      expect(result.missingOccupations).toBeDefined();
      expect(result.missingOccupations?.count).toBe(2);
      expect(result.missingOccupations?.names).toContain('Licensed Practical Nurse');
      expect(result.missingOccupations?.names).toContain('Pharmacist');
    });

    it('should detect duplicate care activities in database and return in duplicates field', async () => {
      // Arrange: Setup mocks
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ displayName: 'Registered Nurse' }),
      ]);

      // Mock that this care activity already exists in DB
      mockCareActivityRepo.find.mockResolvedValue([
        createMockCareActivity({ name: 'testactivity', displayName: 'Test Activity' }),
      ]);

      const dto = {
        headers: createValidHeaders(),
        data: [createValidBulkData()], // No ID = new activity
      };

      // Act
      const result = await service.validateCareActivitiesBulk(dto);

      // Assert: Should have duplicates info (not errors) so frontend can offer options
      expect(result.errors).toHaveLength(0);
      expect(result.duplicates).toBeDefined();
      expect(result.duplicates?.count).toBe(1);
      expect(result.duplicates?.names).toContain('Test Activity');
    });

    it('should allow same-name activities in different care settings without IDs', async () => {
      // Arrange: Same activity name, different care settings, no IDs
      // This scenario occurs after stale-ID stripping removes IDs from rows
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ displayName: 'Registered Nurse' }),
      ]);
      mockCareActivityRepo.find.mockResolvedValue([]);

      const dto = {
        headers: createValidHeaders(),
        data: [
          {
            rowData: {
              [BULK_UPLOAD_COLUMNS.ID]: '', // No ID
              [BULK_UPLOAD_COLUMNS.CARE_SETTING]: 'Setting A',
              [BULK_UPLOAD_COLUMNS.CARE_BUNDLE]: 'Test Bundle',
              [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'Shared Activity',
              [BULK_UPLOAD_COLUMNS.ASPECT_OF_PRACTICE]: CareActivityType.TASK,
              'Registered Nurse': 'Y',
            },
            rowNumber: 2,
          },
          {
            rowData: {
              [BULK_UPLOAD_COLUMNS.ID]: '', // No ID
              [BULK_UPLOAD_COLUMNS.CARE_SETTING]: 'Setting B',
              [BULK_UPLOAD_COLUMNS.CARE_BUNDLE]: 'Test Bundle',
              [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'Shared Activity',
              [BULK_UPLOAD_COLUMNS.ASPECT_OF_PRACTICE]: CareActivityType.TASK,
              'Registered Nurse': 'LC',
            },
            rowNumber: 3,
          },
        ],
      };

      // Act
      const result = await service.validateCareActivitiesBulk(dto);

      // Assert: Should NOT report as duplicate — different care settings makes it valid
      expect(result.errors).toHaveLength(0);
      expect(result.duplicates).toBeUndefined();
    });

    it('should pass validation for valid data with all occupations in headers', async () => {
      // Arrange
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ displayName: 'Registered Nurse' }),
      ]);
      mockCareActivityRepo.find.mockResolvedValue([]); // No duplicates

      const dto = {
        headers: createValidHeaders(),
        data: [createValidBulkData()],
      };

      // Act
      const result = await service.validateCareActivitiesBulk(dto);

      // Assert
      expect(result.errors).toHaveLength(0);
      expect(result.total).toBe(1);
      expect(result.add).toBe(1);
    });
  });

  describe('uploadCareActivitiesBulk', () => {
    it('should rollback all changes if allowed activities upsert fails', async () => {
      // Arrange: Setup mocks for validation to pass
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ displayName: 'Registered Nurse' }),
      ]);
      mockCareActivityRepo.find.mockResolvedValue([]);
      mockUnitService.saveCareLocations.mockResolvedValue(undefined);
      mockUnitService.getAllUnits.mockResolvedValue([
        { id: 'unit-1', name: 'testsetting', displayName: 'Test Setting' },
      ]);
      mockUnitService.getUnitsByNames.mockResolvedValue([
        { id: 'unit-1', name: 'testsetting', displayName: 'Test Setting' },
      ]);
      mockBundleService.upsertBundles.mockResolvedValue(undefined);
      mockBundleService.getManyByNames.mockResolvedValue([
        { id: 'bundle-1', name: 'testbundle', displayName: 'Test Bundle' },
      ]);

      // Track if save was called with care activities
      let careActivitiesSaved = false;
      let transactionRolledBack = false;

      // Mock transaction to simulate rollback behavior
      mockCareActivityRepo.manager.transaction.mockImplementation(async callback => {
        const mockManager = {
          save: jest.fn().mockImplementation(async (entity, data) => {
            if (entity === CareActivity || entity.name === 'CareActivity') {
              careActivitiesSaved = true;
            }
            return Array.isArray(data) ? data.map((d, i) => ({ ...d, id: `saved-${i}` })) : data;
          }),
          create: jest.fn().mockImplementation((entity, data) => data),
          upsert: jest.fn().mockImplementation(async () => {
            // Simulate failure in allowed activities upsert
            transactionRolledBack = true;
            throw new Error('Database constraint violation');
          }),
          delete: jest.fn(),
        };

        try {
          await callback(mockManager);
        } catch (error) {
          // Transaction should rollback - care activities should not persist
          throw error;
        }
      });

      const dto = {
        headers: createValidHeaders(),
        data: [createValidBulkData()],
      };

      // Act & Assert
      await expect(service.uploadCareActivitiesBulk(dto)).rejects.toThrow();

      // The key assertion: transaction was attempted, and when it failed,
      // everything should be rolled back (no partial commits)
      expect(mockCareActivityRepo.manager.transaction).toHaveBeenCalled();
      expect(transactionRolledBack).toBe(true);
    });

    it('should commit all changes on success', async () => {
      // Arrange
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ displayName: 'Registered Nurse' }),
      ]);
      mockCareActivityRepo.find.mockResolvedValue([]);
      mockUnitService.saveCareLocations.mockResolvedValue(undefined);
      mockUnitService.getAllUnits.mockResolvedValue([
        { id: 'unit-1', name: 'testsetting', displayName: 'Test Setting' },
      ]);
      mockUnitService.getUnitsByNames.mockResolvedValue([
        { id: 'unit-1', name: 'testsetting', displayName: 'Test Setting' },
      ]);
      mockBundleService.upsertBundles.mockResolvedValue(undefined);
      mockBundleService.getManyByNames.mockResolvedValue([
        { id: 'bundle-1', name: 'testbundle', displayName: 'Test Bundle' },
      ]);

      let transactionCompleted = false;
      let saveCalled = false;
      let upsertCalled = false;

      mockCareActivityRepo.manager.transaction.mockImplementation(async callback => {
        const mockManager = {
          save: jest.fn().mockImplementation(async (entity, data) => {
            saveCalled = true;
            return Array.isArray(data) ? data.map((d, i) => ({ ...d, id: `saved-${i}` })) : data;
          }),
          create: jest.fn().mockImplementation((entity, data) => data),
          upsert: jest.fn().mockImplementation(async () => {
            upsertCalled = true;
            return { identifiers: [], generatedMaps: [], raw: [] };
          }),
          delete: jest.fn(),
        };

        await callback(mockManager);
        transactionCompleted = true;
      });

      const dto = {
        headers: createValidHeaders(),
        data: [createValidBulkData()],
      };

      // Act
      await service.uploadCareActivitiesBulk(dto);

      // Assert
      expect(transactionCompleted).toBe(true);
      expect(saveCalled).toBe(true);
      expect(upsertCalled).toBe(true);
      expect(mockCareActivityRepo.manager.transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when missing occupations and proceedWithMissingOccupations is not set', async () => {
      // Arrange: Validation passes, but upload throws due to missing occupations guard
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ displayName: 'Missing Occupation' }),
      ]);

      const dto = {
        headers: createValidHeaders(), // Doesn't include "Missing Occupation"
        data: [createValidBulkData()],
      };

      // Act & Assert
      await expect(service.uploadCareActivitiesBulk(dto)).rejects.toThrow(BadRequestException);
      // Transaction should NOT be called since validation failed first
      expect(mockCareActivityRepo.manager.transaction).not.toHaveBeenCalled();
    });

    it('should treat N permission as disallowed and not upsert it', async () => {
      // Arrange
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ displayName: 'Registered Nurse' }),
      ]);
      mockCareActivityRepo.find.mockResolvedValue([]);
      mockUnitService.saveCareLocations.mockResolvedValue(undefined);
      mockUnitService.getAllUnits.mockResolvedValue([
        { id: 'unit-1', name: 'testsetting', displayName: 'Test Setting' },
      ]);
      mockUnitService.getUnitsByNames.mockResolvedValue([
        { id: 'unit-1', name: 'testsetting', displayName: 'Test Setting' },
      ]);
      mockBundleService.upsertBundles.mockResolvedValue(undefined);
      mockBundleService.getManyByNames.mockResolvedValue([
        { id: 'bundle-1', name: 'testbundle', displayName: 'Test Bundle' },
      ]);

      let upsertCalledWithN = false;

      mockCareActivityRepo.manager.transaction.mockImplementation(async callback => {
        const mockManager = {
          save: jest.fn().mockImplementation(async (entity, data) => {
            return Array.isArray(data) ? data.map((d, i) => ({ ...d, id: `saved-${i}` })) : data;
          }),
          create: jest.fn().mockImplementation((entity, data) => {
            // Check if any data has permission 'N'
            if (data && data.permission === 'N') {
              upsertCalledWithN = true;
            }
            return data;
          }),
          upsert: jest.fn().mockResolvedValue({ identifiers: [], generatedMaps: [], raw: [] }),
          delete: jest.fn(),
        };

        await callback(mockManager);
      });

      // Data with 'N' permission - should NOT be upserted
      const dto = {
        headers: createValidHeaders(),
        data: [
          createValidBulkData({ 'Registered Nurse': 'N' }), // 'N' should be treated as disallowed
        ],
      };

      // Act
      await service.uploadCareActivitiesBulk(dto);

      // Assert: 'N' should not have been passed to upsert
      expect(upsertCalledWithN).toBe(false);
    });

    it('should handle mixed permissions (Y, LC, N) correctly', async () => {
      // Arrange: Multiple occupations with different permissions
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ id: 'occ-1', displayName: 'Registered Nurse' }),
        createMockOccupation({ id: 'occ-2', displayName: 'Licensed Practical Nurse' }),
        createMockOccupation({ id: 'occ-3', displayName: 'Pharmacist' }),
      ]);
      mockCareActivityRepo.find.mockResolvedValue([]);
      mockUnitService.saveCareLocations.mockResolvedValue(undefined);
      mockUnitService.getAllUnits.mockResolvedValue([
        { id: 'unit-1', name: 'testsetting', displayName: 'Test Setting' },
      ]);
      mockUnitService.getUnitsByNames.mockResolvedValue([
        { id: 'unit-1', name: 'testsetting', displayName: 'Test Setting' },
      ]);
      mockBundleService.upsertBundles.mockResolvedValue(undefined);
      mockBundleService.getManyByNames.mockResolvedValue([
        { id: 'bundle-1', name: 'testbundle', displayName: 'Test Bundle' },
      ]);

      const upsertedPermissions: string[] = [];
      const deletedCount = { value: 0 };

      mockCareActivityRepo.manager.transaction.mockImplementation(async callback => {
        const mockManager = {
          save: jest.fn().mockImplementation(async (entity, data) => {
            return Array.isArray(data) ? data.map((d, i) => ({ ...d, id: `saved-${i}` })) : data;
          }),
          create: jest.fn().mockImplementation((entity, data) => {
            if (data && data.permission) {
              upsertedPermissions.push(data.permission);
            }
            return data;
          }),
          upsert: jest.fn().mockResolvedValue({ identifiers: [], generatedMaps: [], raw: [] }),
          delete: jest.fn().mockImplementation(async () => {
            deletedCount.value++;
          }),
        };

        await callback(mockManager);
      });

      const headers = [
        BULK_UPLOAD_COLUMNS.ID,
        BULK_UPLOAD_COLUMNS.CARE_SETTING,
        BULK_UPLOAD_COLUMNS.CARE_BUNDLE,
        BULK_UPLOAD_COLUMNS.CARE_ACTIVITY,
        BULK_UPLOAD_COLUMNS.ASPECT_OF_PRACTICE,
        'Registered Nurse',
        'Licensed Practical Nurse',
        'Pharmacist',
      ];

      const dto = {
        headers,
        data: [
          {
            rowData: {
              [BULK_UPLOAD_COLUMNS.ID]: '',
              [BULK_UPLOAD_COLUMNS.CARE_SETTING]: 'Test Setting',
              [BULK_UPLOAD_COLUMNS.CARE_BUNDLE]: 'Test Bundle',
              [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'Test Activity',
              [BULK_UPLOAD_COLUMNS.ASPECT_OF_PRACTICE]: CareActivityType.TASK,
              'Registered Nurse': 'Y', // Should be upserted
              'Licensed Practical Nurse': 'LC', // Should be upserted
              Pharmacist: 'N', // Should trigger delete, not upsert
            },
            rowNumber: 2,
          },
        ],
      };

      // Act
      await service.uploadCareActivitiesBulk(dto);

      // Assert: Only Y and LC should be upserted, N should trigger delete
      expect(upsertedPermissions).toContain('Y');
      expect(upsertedPermissions).toContain('LC');
      expect(upsertedPermissions).not.toContain('N');
    });

    it('should reject empty permission values during validation', async () => {
      // Arrange
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ displayName: 'Registered Nurse' }),
      ]);
      mockCareActivityRepo.find.mockResolvedValue([]);

      // Data with empty permission - should fail validation
      const dto = {
        headers: createValidHeaders(),
        data: [createValidBulkData({ 'Registered Nurse': '' })],
      };

      // Act
      const result = await service.validateCareActivitiesBulk(dto);

      // Assert: Validation should catch empty permission
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid permission values during validation', async () => {
      // Arrange
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ displayName: 'Registered Nurse' }),
      ]);
      mockCareActivityRepo.find.mockResolvedValue([]);

      // Data with invalid permission value
      const dto = {
        headers: createValidHeaders(),
        data: [createValidBulkData({ 'Registered Nurse': 'INVALID' })],
      };

      // Act
      const result = await service.validateCareActivitiesBulk(dto);

      // Assert: Validation should catch invalid permission
      expect(result.errors.length).toBeGreaterThan(0);
      const permissionError = result.errors.find(e => e.message.includes('Occupation scope'));
      expect(permissionError).toBeDefined();
    });
  });

  describe('duplicate handling', () => {
    // Helper to setup common mocks for duplicate handling tests
    const setupDuplicateTestMocks = () => {
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ displayName: 'Registered Nurse' }),
      ]);
      mockUnitService.saveCareLocations.mockResolvedValue(undefined);
      mockUnitService.getAllUnits.mockResolvedValue([
        { id: 'unit-1', name: 'testsetting', displayName: 'Test Setting' },
      ]);
      mockUnitService.getUnitsByNames.mockResolvedValue([
        { id: 'unit-1', name: 'testsetting', displayName: 'Test Setting' },
      ]);
      mockBundleService.upsertBundles.mockResolvedValue(undefined);
      mockBundleService.getManyByNames.mockResolvedValue([
        { id: 'bundle-1', name: 'testbundle', displayName: 'Test Bundle' },
      ]);
    };

    const setupTransactionMock = (onSave?: (data: any) => void) => {
      mockCareActivityRepo.manager.transaction.mockImplementation(async callback => {
        const mockManager = {
          save: jest.fn().mockImplementation(async (entity, data) => {
            if (onSave) onSave(data);
            return Array.isArray(data) ? data.map((d, i) => ({ ...d, id: `saved-${i}` })) : data;
          }),
          create: jest.fn().mockImplementation((entity, data) => data),
          upsert: jest.fn().mockResolvedValue({ identifiers: [], generatedMaps: [], raw: [] }),
          delete: jest.fn(),
        };
        await callback(mockManager);
      });
    };

    it('should return duplicates info in validation response', async () => {
      // Arrange: DB has existing activities that match upload data
      setupDuplicateTestMocks();
      mockCareActivityRepo.find.mockResolvedValue([
        createMockCareActivity({
          id: 'existing-1',
          name: 'testactivity',
          displayName: 'Test Activity',
        }),
      ]);

      const dto = {
        headers: createValidHeaders(),
        data: [createValidBulkData()], // No ID = new activity, but name matches existing
      };

      // Act
      const result = await service.validateCareActivitiesBulk(dto);

      // Assert: Should include duplicates info in response (not just errors)
      expect(result.duplicates).toBeDefined();
      expect(result.duplicates?.count).toBe(1);
      expect(result.duplicates?.names).toContain('Test Activity');
    });

    it('should skip duplicate activities when duplicateHandling is "skip"', async () => {
      // Arrange
      setupDuplicateTestMocks();

      // Existing activity in DB
      mockCareActivityRepo.find.mockResolvedValue([
        createMockCareActivity({
          id: 'existing-1',
          name: 'existingactivity',
          displayName: 'Existing Activity',
        }),
      ]);

      const savedActivities: any[] = [];
      setupTransactionMock(data => {
        if (Array.isArray(data)) savedActivities.push(...data);
      });

      const dto = {
        headers: createValidHeaders(),
        data: [
          createValidBulkData({ [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'Existing Activity' }), // Duplicate
          createValidBulkData({ [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'New Activity' }), // New
        ],
        duplicateHandling: DuplicateHandling.SKIP,
      };

      // Act
      await service.uploadCareActivitiesBulk(dto);

      // Assert: Only new activity should be saved, duplicate should be skipped
      expect(savedActivities.length).toBe(1);
      expect(savedActivities[0].displayName).toBe('New Activity');
    });

    it('should update existing activities when duplicateHandling is "update"', async () => {
      // Arrange
      setupDuplicateTestMocks();

      // Existing activity in DB
      const existingActivity = createMockCareActivity({
        id: 'existing-1',
        name: 'existingactivity',
        displayName: 'Existing Activity',
      });
      mockCareActivityRepo.find.mockResolvedValue([existingActivity]);

      const savedActivities: any[] = [];
      setupTransactionMock(data => {
        if (Array.isArray(data)) savedActivities.push(...data);
      });

      const dto = {
        headers: createValidHeaders(),
        data: [
          createValidBulkData({ [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'Existing Activity' }), // Should update
          createValidBulkData({ [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'New Activity' }), // New
        ],
        duplicateHandling: DuplicateHandling.UPDATE,
      };

      // Act
      await service.uploadCareActivitiesBulk(dto);

      // Assert: Both activities should be processed (existing updated, new added)
      expect(savedActivities.length).toBe(2);
      // The existing activity should have its ID set for update
      const existingInSaved = savedActivities.find(a => a.displayName === 'Existing Activity');
      expect(existingInSaved).toBeDefined();
    });

    it('should reject with helpful message when duplicateHandling is "reject" (default)', async () => {
      // Arrange
      setupDuplicateTestMocks();
      mockCareActivityRepo.find.mockResolvedValue([
        createMockCareActivity({
          id: 'existing-1',
          name: 'testactivity',
          displayName: 'Test Activity',
        }),
      ]);

      const dto = {
        headers: createValidHeaders(),
        data: [createValidBulkData()],
        // No duplicateHandling specified = defaults to reject
      };

      // Act & Assert
      await expect(service.uploadCareActivitiesBulk(dto)).rejects.toThrow(BadRequestException);
      expect(mockCareActivityRepo.manager.transaction).not.toHaveBeenCalled();
    });

    it('should handle all duplicates with skip - success with 0 added', async () => {
      // Arrange: All activities already exist
      setupDuplicateTestMocks();
      mockCareActivityRepo.find.mockResolvedValue([
        createMockCareActivity({ id: 'existing-1', name: 'activity1', displayName: 'Activity 1' }),
        createMockCareActivity({ id: 'existing-2', name: 'activity2', displayName: 'Activity 2' }),
      ]);

      const savedActivities: any[] = [];
      setupTransactionMock(data => {
        if (Array.isArray(data)) savedActivities.push(...data);
      });

      const dto = {
        headers: createValidHeaders(),
        data: [
          createValidBulkData({ [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'Activity 1' }),
          createValidBulkData({ [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'Activity 2' }),
        ],
        duplicateHandling: DuplicateHandling.SKIP,
      };

      // Act - should not throw
      await service.uploadCareActivitiesBulk(dto);

      // Assert: No activities saved (all skipped)
      expect(savedActivities.length).toBe(0);
    });

    it('should handle mixed scenario: some new, some duplicates with skip', async () => {
      // Arrange
      setupDuplicateTestMocks();
      mockCareActivityRepo.find.mockResolvedValue([
        createMockCareActivity({
          id: 'existing-1',
          name: 'duplicate1',
          displayName: 'Duplicate 1',
        }),
        createMockCareActivity({
          id: 'existing-2',
          name: 'duplicate2',
          displayName: 'Duplicate 2',
        }),
      ]);

      const savedActivities: any[] = [];
      setupTransactionMock(data => {
        if (Array.isArray(data)) savedActivities.push(...data);
      });

      const dto = {
        headers: createValidHeaders(),
        data: [
          createValidBulkData({ [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'Duplicate 1' }),
          createValidBulkData({ [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'New Activity 1' }),
          createValidBulkData({ [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'Duplicate 2' }),
          createValidBulkData({ [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'New Activity 2' }),
        ],
        duplicateHandling: DuplicateHandling.SKIP,
      };

      // Act
      await service.uploadCareActivitiesBulk(dto);

      // Assert: Only new activities saved (2 out of 4)
      expect(savedActivities.length).toBe(2);
      expect(savedActivities.map(a => a.displayName)).toContain('New Activity 1');
      expect(savedActivities.map(a => a.displayName)).toContain('New Activity 2');
      expect(savedActivities.map(a => a.displayName)).not.toContain('Duplicate 1');
      expect(savedActivities.map(a => a.displayName)).not.toContain('Duplicate 2');
    });
  });

  describe('missing occupations handling', () => {
    it('should return missingOccupations info when file is missing occupation columns', async () => {
      // Arrange: DB has occupations that are NOT in the uploaded file headers
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ id: 'occ-1', displayName: 'Registered Nurse' }),
        createMockOccupation({ id: 'occ-2', displayName: 'New Occupation 1' }),
        createMockOccupation({ id: 'occ-3', displayName: 'New Occupation 2' }),
      ]);
      mockCareActivityRepo.find.mockResolvedValue([]);

      // Headers only include "Registered Nurse", missing the other two
      const dto = {
        headers: createValidHeaders(), // Only has "Registered Nurse"
        data: [createValidBulkData()],
      };

      // Act
      const result = await service.validateCareActivitiesBulk(dto);

      // Assert: Should return missingOccupations info (not errors)
      expect(result.missingOccupations).toBeDefined();
      expect(result.missingOccupations?.count).toBe(2);
      expect(result.missingOccupations?.names).toContain('New Occupation 1');
      expect(result.missingOccupations?.names).toContain('New Occupation 2');
    });

    it('should NOT add missing occupations to errors array', async () => {
      // Arrange
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ id: 'occ-1', displayName: 'Registered Nurse' }),
        createMockOccupation({ id: 'occ-2', displayName: 'Missing Occupation' }),
      ]);
      mockCareActivityRepo.find.mockResolvedValue([]);

      const dto = {
        headers: createValidHeaders(),
        data: [createValidBulkData()],
      };

      // Act
      const result = await service.validateCareActivitiesBulk(dto);

      // Assert: Errors should be empty (missing occupations is info, not error)
      expect(result.errors).toHaveLength(0);
      expect(result.missingOccupations).toBeDefined();
    });

    it('should continue validation even with missing occupation columns', async () => {
      // Arrange: Missing occupation but otherwise valid data
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ id: 'occ-1', displayName: 'Registered Nurse' }),
        createMockOccupation({ id: 'occ-2', displayName: 'Missing Occupation' }),
      ]);
      mockCareActivityRepo.find.mockResolvedValue([]);

      const dto = {
        headers: createValidHeaders(),
        data: [createValidBulkData()],
      };

      // Act
      const result = await service.validateCareActivitiesBulk(dto);

      // Assert: Should return counts even with missing occupations
      expect(result.add).toBe(1);
      expect(result.total).toBe(1);
      expect(result.missingOccupations?.count).toBe(1);
    });

    it('should skip permission validation for missing occupation columns', async () => {
      // Arrange: Missing occupation column - should not cause permission validation error
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ id: 'occ-1', displayName: 'Registered Nurse' }),
        createMockOccupation({ id: 'occ-2', displayName: 'Missing Occupation' }),
      ]);
      mockCareActivityRepo.find.mockResolvedValue([]);

      // Data has valid permission for existing column, but missing column has no value
      const dto = {
        headers: createValidHeaders(),
        data: [createValidBulkData({ 'Registered Nurse': 'Y' })], // No "Missing Occupation" column
      };

      // Act
      const result = await service.validateCareActivitiesBulk(dto);

      // Assert: Should not have permission validation errors for missing column
      const permissionError = result.errors.find(e => e.message.includes('Occupation scope'));
      expect(permissionError).toBeUndefined();
    });

    it('should allow upload when proceedWithMissingOccupations is true', async () => {
      // Arrange
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ id: 'occ-1', displayName: 'Registered Nurse' }),
        createMockOccupation({ id: 'occ-2', displayName: 'Missing Occupation' }),
      ]);
      mockCareActivityRepo.find.mockResolvedValue([]);
      mockUnitService.saveCareLocations.mockResolvedValue(undefined);
      mockUnitService.getAllUnits.mockResolvedValue([
        { id: 'unit-1', name: 'testsetting', displayName: 'Test Setting' },
      ]);
      mockUnitService.getUnitsByNames.mockResolvedValue([
        { id: 'unit-1', name: 'testsetting', displayName: 'Test Setting' },
      ]);
      mockBundleService.upsertBundles.mockResolvedValue(undefined);
      mockBundleService.getManyByNames.mockResolvedValue([
        { id: 'bundle-1', name: 'testbundle', displayName: 'Test Bundle' },
      ]);

      let uploadSucceeded = false;
      mockCareActivityRepo.manager.transaction.mockImplementation(async callback => {
        const mockManager = {
          save: jest.fn().mockImplementation(async (entity, data) => {
            uploadSucceeded = true;
            return Array.isArray(data) ? data.map((d, i) => ({ ...d, id: `saved-${i}` })) : data;
          }),
          create: jest.fn().mockImplementation((entity, data) => data),
          upsert: jest.fn().mockResolvedValue({ identifiers: [], generatedMaps: [], raw: [] }),
          delete: jest.fn(),
        };
        await callback(mockManager);
      });

      const dto = {
        headers: createValidHeaders(),
        data: [createValidBulkData()],
        proceedWithMissingOccupations: true, // User chose to proceed
      };

      // Act - should NOT throw
      await service.uploadCareActivitiesBulk(dto);

      // Assert
      expect(uploadSucceeded).toBe(true);
    });

    it('should reject upload when missing occupations and proceedWithMissingOccupations is false/undefined', async () => {
      // Arrange
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ id: 'occ-1', displayName: 'Registered Nurse' }),
        createMockOccupation({ id: 'occ-2', displayName: 'Missing Occupation' }),
      ]);
      mockCareActivityRepo.find.mockResolvedValue([]);

      const dto = {
        headers: createValidHeaders(),
        data: [createValidBulkData()],
        // proceedWithMissingOccupations not set (undefined)
      };

      // Act & Assert
      await expect(service.uploadCareActivitiesBulk(dto)).rejects.toThrow(BadRequestException);
      expect(mockCareActivityRepo.manager.transaction).not.toHaveBeenCalled();
    });
  });

  describe('combined scenarios', () => {
    it('should handle both missing occupations and duplicates in validation response', async () => {
      // Arrange: DB has missing occupation AND duplicate activity
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ id: 'occ-1', displayName: 'Registered Nurse' }),
        createMockOccupation({ id: 'occ-2', displayName: 'Missing Occupation' }),
      ]);
      // Existing activity that will be detected as duplicate
      mockCareActivityRepo.find.mockResolvedValue([
        createMockCareActivity({
          id: 'existing-1',
          name: 'testactivity',
          displayName: 'Test Activity',
        }),
      ]);

      const dto = {
        headers: createValidHeaders(), // Missing 'Missing Occupation'
        data: [createValidBulkData()], // Same name as existing activity
      };

      // Act
      const result = await service.validateCareActivitiesBulk(dto);

      // Assert: Should return BOTH missingOccupations info AND duplicates info
      expect(result.missingOccupations).toBeDefined();
      expect(result.missingOccupations?.count).toBe(1);
      expect(result.missingOccupations?.names).toContain('Missing Occupation');

      expect(result.duplicates).toBeDefined();
      expect(result.duplicates?.count).toBe(1);
      expect(result.duplicates?.names).toContain('Test Activity');
    });

    it('should allow upload with both missing occupations and duplicates when properly handled', async () => {
      // Arrange
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ id: 'occ-1', displayName: 'Registered Nurse' }),
        createMockOccupation({ id: 'occ-2', displayName: 'Missing Occupation' }),
      ]);
      mockCareActivityRepo.find.mockResolvedValue([
        createMockCareActivity({
          id: 'existing-1',
          name: 'existingactivity',
          displayName: 'Existing Activity',
        }),
      ]);
      mockUnitService.saveCareLocations.mockResolvedValue(undefined);
      mockUnitService.getAllUnits.mockResolvedValue([
        { id: 'unit-1', name: 'testsetting', displayName: 'Test Setting' },
      ]);
      mockUnitService.getUnitsByNames.mockResolvedValue([
        { id: 'unit-1', name: 'testsetting', displayName: 'Test Setting' },
      ]);
      mockBundleService.upsertBundles.mockResolvedValue(undefined);
      mockBundleService.getManyByNames.mockResolvedValue([
        { id: 'bundle-1', name: 'testbundle', displayName: 'Test Bundle' },
      ]);

      const savedActivities: any[] = [];
      mockCareActivityRepo.manager.transaction.mockImplementation(async callback => {
        const mockManager = {
          save: jest.fn().mockImplementation(async (entity, data) => {
            if (Array.isArray(data)) savedActivities.push(...data);
            return Array.isArray(data) ? data.map((d, i) => ({ ...d, id: `saved-${i}` })) : data;
          }),
          create: jest.fn().mockImplementation((entity, data) => data),
          upsert: jest.fn().mockResolvedValue({ identifiers: [], generatedMaps: [], raw: [] }),
          delete: jest.fn(),
        };
        await callback(mockManager);
      });

      const dto = {
        headers: createValidHeaders(),
        data: [
          createValidBulkData({ [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'Existing Activity' }), // Duplicate
          createValidBulkData({ [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'New Activity' }), // New
        ],
        proceedWithMissingOccupations: true, // Handle missing occupations
        duplicateHandling: DuplicateHandling.SKIP, // Handle duplicates
      };

      // Act - should succeed
      await service.uploadCareActivitiesBulk(dto);

      // Assert: Only new activity saved (duplicate skipped)
      expect(savedActivities.length).toBe(1);
      expect(savedActivities[0].displayName).toBe('New Activity');
    });
  });

  describe('stale IDs handling', () => {
    it('should return missingIds info when IDs do not exist in DB', async () => {
      // Arrange: Data with IDs that don't exist in the database
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ id: 'occ-1', displayName: 'Registered Nurse' }),
      ]);
      // First call: ID lookup returns empty (no matching IDs)
      // Second call: duplicate check returns empty
      mockCareActivityRepo.find.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const dto = {
        headers: createValidHeaders(),
        data: [
          {
            ...createValidBulkData({
              [BULK_UPLOAD_COLUMNS.ID]: 'non-existent-id-1',
              [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'Activity With Stale ID',
            }),
            rowNumber: 2,
          },
          {
            ...createValidBulkData({
              [BULK_UPLOAD_COLUMNS.ID]: 'non-existent-id-2',
              [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'Another Activity With Stale ID',
            }),
            rowNumber: 3,
          },
        ],
      };

      // Act
      const result = await service.validateCareActivitiesBulk(dto);

      // Assert: Should return missingIds info
      expect(result.missingIds).toBeDefined();
      expect(result.missingIds?.count).toBe(2);
      expect(result.missingIds?.names).toContain('Activity With Stale ID');
      expect(result.missingIds?.names).toContain('Another Activity With Stale ID');
      expect(result.missingIds?.rowNumbers).toEqual(expect.arrayContaining([2, 3]));
      // Should not be in errors (it's info, not error)
      expect(result.errors.length).toBe(0);
    });

    it('should reject upload without proceedWithStaleIds flag', async () => {
      // Arrange
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ id: 'occ-1', displayName: 'Registered Nurse' }),
      ]);
      mockCareActivityRepo.find.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const dto = {
        headers: createValidHeaders(),
        data: [
          {
            ...createValidBulkData({
              [BULK_UPLOAD_COLUMNS.ID]: 'non-existent-id',
              [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'Activity With Stale ID',
            }),
            rowNumber: 2,
          },
        ],
        // proceedWithStaleIds not set
      };

      // Act & Assert - single call to avoid consuming mocks twice
      await expect(service.uploadCareActivitiesBulk(dto)).rejects.toThrow(
        /activities have IDs that don't exist/,
      );
      expect(mockCareActivityRepo.manager.transaction).not.toHaveBeenCalled();
    });

    it('should strip IDs and proceed with proceedWithStaleIds: true', async () => {
      // Arrange
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ id: 'occ-1', displayName: 'Registered Nurse' }),
      ]);
      // All find calls return empty:
      // 1. ID lookup in checkCareActivitiesUniq → no match (stale ID)
      // 2. Proactive name match in checkCareActivitiesUniq → no match
      // 3. TOCTOU re-check in uploadCareActivitiesBulk → no match
      mockCareActivityRepo.find.mockResolvedValue([]);
      mockUnitService.saveCareLocations.mockResolvedValue(undefined);
      mockUnitService.getAllUnits.mockResolvedValue([
        { id: 'unit-1', name: 'testsetting', displayName: 'Test Setting' },
      ]);
      mockUnitService.getUnitsByNames.mockResolvedValue([
        { id: 'unit-1', name: 'testsetting', displayName: 'Test Setting' },
      ]);
      mockBundleService.upsertBundles.mockResolvedValue(undefined);
      mockBundleService.getManyByNames.mockResolvedValue([
        { id: 'bundle-1', name: 'testbundle', displayName: 'Test Bundle' },
      ]);

      const savedActivities: any[] = [];
      mockCareActivityRepo.manager.transaction.mockImplementation(async callback => {
        const mockManager = {
          save: jest.fn().mockImplementation(async (entity, data) => {
            if (Array.isArray(data)) savedActivities.push(...data);
            return Array.isArray(data) ? data.map((d, i) => ({ ...d, id: `saved-${i}` })) : data;
          }),
          create: jest.fn().mockImplementation((entity, data) => data),
          upsert: jest.fn().mockResolvedValue({ identifiers: [], generatedMaps: [], raw: [] }),
          delete: jest.fn(),
        };
        await callback(mockManager);
      });

      const dto = {
        headers: createValidHeaders(),
        data: [
          {
            ...createValidBulkData({
              [BULK_UPLOAD_COLUMNS.ID]: 'stale-id-123',
              [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'Activity With Stale ID',
            }),
            rowNumber: 2,
          },
        ],
        proceedWithStaleIds: true,
      };

      // Act - should succeed
      await service.uploadCareActivitiesBulk(dto);

      // Assert: Activity should be saved as new (ID stripped)
      expect(savedActivities.length).toBe(1);
      expect(savedActivities[0].displayName).toBe('Activity With Stale ID');
      expect(mockCareActivityRepo.manager.transaction).toHaveBeenCalled();
    });

    it('should detect new duplicates after stripping IDs (TOCTOU fix)', async () => {
      // Arrange: Stale ID row has same name as existing activity
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ id: 'occ-1', displayName: 'Registered Nurse' }),
      ]);

      const existingActivity = createMockCareActivity({
        id: 'existing-1',
        name: 'duplicateactivity',
        displayName: 'Duplicate Activity',
      });

      // The find calls are:
      // 1. ID lookup in checkCareActivitiesUniq → returns empty (stale ID)
      // 2. Proactive name match in checkCareActivitiesUniq → returns match
      // 3. TOCTOU re-check in uploadCareActivitiesBulk → finds duplicate
      mockCareActivityRepo.find
        .mockResolvedValueOnce([]) // ID lookup - no match for stale ID
        .mockResolvedValueOnce([existingActivity]) // Proactive name match check
        .mockResolvedValueOnce([existingActivity]); // TOCTOU re-check finds duplicate

      const dto = {
        headers: createValidHeaders(),
        data: [
          {
            ...createValidBulkData({
              [BULK_UPLOAD_COLUMNS.ID]: 'stale-id-xyz',
              [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'Duplicate Activity', // Same as existing
            }),
            rowNumber: 2,
          },
        ],
        proceedWithStaleIds: true,
        duplicateHandling: DuplicateHandling.REJECT, // Should throw
      };

      // Act & Assert: Should throw because TOCTOU check found duplicate
      // Note: Only call once - calling twice would consume mock responses
      await expect(service.uploadCareActivitiesBulk(dto)).rejects.toThrow(
        /activities now match existing records/,
      );
    });

    it('should apply SKIP handling to duplicates found after stripping IDs', async () => {
      // Arrange
      mockOccupationService.getAllOccupations.mockResolvedValue([
        createMockOccupation({ id: 'occ-1', displayName: 'Registered Nurse' }),
      ]);

      const existingActivity = createMockCareActivity({
        id: 'existing-1',
        name: 'duplicateactivity',
        displayName: 'Duplicate Activity',
      });

      mockCareActivityRepo.find
        .mockResolvedValueOnce([]) // ID lookup
        .mockResolvedValueOnce([]) // Initial duplicate check
        .mockResolvedValueOnce([existingActivity]); // TOCTOU re-check

      mockUnitService.saveCareLocations.mockResolvedValue(undefined);
      mockUnitService.getAllUnits.mockResolvedValue([
        { id: 'unit-1', name: 'testsetting', displayName: 'Test Setting' },
      ]);
      mockUnitService.getUnitsByNames.mockResolvedValue([
        { id: 'unit-1', name: 'testsetting', displayName: 'Test Setting' },
      ]);
      mockBundleService.upsertBundles.mockResolvedValue(undefined);
      mockBundleService.getManyByNames.mockResolvedValue([
        { id: 'bundle-1', name: 'testbundle', displayName: 'Test Bundle' },
      ]);

      const savedActivities: any[] = [];
      mockCareActivityRepo.manager.transaction.mockImplementation(async callback => {
        const mockManager = {
          save: jest.fn().mockImplementation(async (entity, data) => {
            if (Array.isArray(data)) savedActivities.push(...data);
            return Array.isArray(data) ? data.map((d, i) => ({ ...d, id: `saved-${i}` })) : data;
          }),
          create: jest.fn().mockImplementation((entity, data) => data),
          upsert: jest.fn().mockResolvedValue({ identifiers: [], generatedMaps: [], raw: [] }),
          delete: jest.fn(),
        };
        await callback(mockManager);
      });

      const dto = {
        headers: createValidHeaders(),
        data: [
          {
            ...createValidBulkData({
              [BULK_UPLOAD_COLUMNS.ID]: 'stale-id-xyz',
              [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'Duplicate Activity',
            }),
            rowNumber: 2,
          },
          {
            ...createValidBulkData({
              [BULK_UPLOAD_COLUMNS.ID]: '', // New activity (no ID)
              [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: 'New Activity',
            }),
            rowNumber: 3,
          },
        ],
        proceedWithStaleIds: true,
        duplicateHandling: DuplicateHandling.SKIP,
      };

      // Act - should succeed, skipping the duplicate
      await service.uploadCareActivitiesBulk(dto);

      // Assert: Only the new activity saved, duplicate skipped
      expect(savedActivities.length).toBe(1);
      expect(savedActivities[0].displayName).toBe('New Activity');
    });
  });
});
