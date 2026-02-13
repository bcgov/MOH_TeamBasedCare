import {
  BadRequestException,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  BULK_UPLOAD_ALLOWED_PERMISSIONS,
  BULK_UPLOAD_COLUMNS,
  CareActivityBulkData,
  CareActivityBulkDTO,
  CareActivityBulkRO,
  CareActivityBulkROError,
  CareActivityType,
  DuplicateHandling,
  DuplicateInfo,
  MissingIdsInfo,
  MissingOccupationsInfo,
  Permissions,
} from '@tbcm/common';
import { OccupationService } from 'src/occupation/occupation.service';
import { InjectRepository } from '@nestjs/typeorm';
import { CareActivity } from './entity/care-activity.entity';
import { In, Repository } from 'typeorm';
import { cleanText } from 'src/common/utils';
import { UnitService } from 'src/unit/unit.service';
import { BundleService } from './bundle.service';
import { Occupation } from 'src/occupation/entity/occupation.entity';
import { AllowedActivity } from 'src/allowed-activity/entity/allowed-activity.entity';
import { AllowedActivityService } from 'src/allowed-activity/allowed-activity.service';
import { CareSettingTemplateService } from 'src/unit/care-setting-template.service';
import { AppLogger } from 'src/common/logger.service';
import _ from 'lodash';

@Injectable()
export class CareActivityBulkService {
  private readonly logger = new AppLogger();

  constructor(
    @InjectRepository(CareActivity)
    private readonly careActivityRepo: Repository<CareActivity>,

    @Inject(OccupationService)
    private readonly occupationService: OccupationService,

    @Inject(UnitService)
    private readonly unitService: UnitService,

    @Inject(BundleService)
    private readonly bundleService: BundleService,

    @Inject(AllowedActivityService)
    private readonly allowedActivityService: AllowedActivityService,

    @Inject(CareSettingTemplateService)
    private readonly careSettingTemplateService: CareSettingTemplateService,
  ) {}

  trimDisplayName(displayName: string): string {
    return displayName.toString().trim().replace(/"/g, '');
  }

  getNameFromDisplayName(displayName: string): string {
    return cleanText(this.trimDisplayName(displayName));
  }

  async validateCareActivitiesBulk(
    careActivitiesBulkDto: CareActivityBulkDTO,
  ): Promise<CareActivityBulkRO> {
    // Delegate to internal method and return just the RO part
    const { result } = await this.validateWithEntities(careActivitiesBulkDto);
    return result;
  }

  private async checkCareActivitiesUniq(data: CareActivityBulkData[]): Promise<{
    duplicateInfo?: DuplicateInfo;
    duplicateActivities: CareActivity[];
    idErrors: CareActivityBulkROError[];
    missingIdsInfo?: MissingIdsInfo;
  }> {
    // This method assumes all column values exist in the rowData array
    const idErrors: CareActivityBulkROError[] = [];

    // Extract IDs from rows (reused for lookup and difference check)
    const idsFromRows = data
      .map(row => row.rowData[BULK_UPLOAD_COLUMNS.ID]?.trim())
      .filter(Boolean);

    // validate rows with ID
    let activities: CareActivity[];
    try {
      activities = await this.careActivityRepo.find({
        where: {
          id: In(idsFromRows),
        },
      });
    } catch (e) {
      idErrors.push({
        message: `ID must be empty for new care activities or should not be modified.`,
      });
      return { duplicateActivities: [], idErrors };
    }

    // Find IDs that don't exist in the database
    const missingIdValues = _.difference(
      idsFromRows,
      activities.map(e => e.id),
    );

    // Build MissingIdsInfo instead of individual errors
    // This allows frontend to show a grouped warning with "Strip IDs and add as new" option
    let missingIdsInfo: MissingIdsInfo | undefined;
    if (missingIdValues.length > 0) {
      const missingRows = data.filter(row =>
        missingIdValues.includes(row.rowData[BULK_UPLOAD_COLUMNS.ID]?.trim()),
      );

      // Proactively check how many stale-ID rows match existing activities by name
      // This lets the frontend offer a 1-step "Sync" option instead of Strip → Duplicate flow
      // Count matching ROWS (not unique entities) so the math with count is consistent
      const staleRowNames = missingRows.map(r =>
        this.getNameFromDisplayName(r.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]),
      );
      const uniqueStaleNames = [...new Set(staleRowNames)];
      const matchingExisting =
        uniqueStaleNames.length > 0
          ? await this.careActivityRepo.find({
              where: { name: In(uniqueStaleNames) },
              select: ['name'],
            })
          : [];
      const matchingNameSet = new Set(matchingExisting.map(a => a.name));
      const matchingRowCount = staleRowNames.filter(n => matchingNameSet.has(n)).length;

      missingIdsInfo = {
        count: missingIdValues.length,
        names: missingRows
          .slice(0, 10)
          .map(r => r.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY] || 'Unknown'),
        rowNumbers: missingRows.map(r => r.rowNumber),
        matchingExistingCount: matchingRowCount,
      };
    }

    // ** ensure care activity names are not duplicated in the database
    const rowsWithoutId = data.filter(row => !row.rowData[BULK_UPLOAD_COLUMNS.ID]?.trim());
    if (rowsWithoutId.length === 0) {
      // All rows have IDs, so they're updates (not new activities).
      // Duplicate-by-name check only applies to new activities.
      // Note: Stale IDs are caught by missingIdsInfo; TOCTOU re-check in
      // uploadCareActivitiesBulk handles duplicates after ID stripping.
      return { duplicateActivities: [], idErrors, missingIdsInfo };
    }

    const duplicateCareActivitiesDb = await this.careActivityRepo.find({
      where: {
        name: In(
          rowsWithoutId.map(c =>
            this.getNameFromDisplayName(c.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]),
          ),
        ),
      },
    });

    // Build duplicate info for response
    let duplicateInfo: DuplicateInfo | undefined;
    if (duplicateCareActivitiesDb.length > 0) {
      // Use flatMap + filter to capture ALL rows matching each duplicate (defensive)
      const duplicateRowNumbers = duplicateCareActivitiesDb.flatMap(ca => {
        const rows = data.filter(
          c =>
            this.getNameFromDisplayName(c.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]) === ca.name,
        );
        return rows.map(r => r.rowNumber);
      });

      duplicateInfo = {
        count: duplicateCareActivitiesDb.length,
        names: duplicateCareActivitiesDb.map(ca => ca.displayName),
        rowNumbers: duplicateRowNumbers,
      };
    }

    return {
      duplicateInfo,
      duplicateActivities: duplicateCareActivitiesDb,
      idErrors,
      missingIdsInfo,
    };
  }

  /**
   * Internal validation that returns both the RO and entity data
   * Used by uploadCareActivitiesBulk to avoid double DB query
   */
  private async validateWithEntities(careActivitiesBulkDto: CareActivityBulkDTO): Promise<{
    result: CareActivityBulkRO;
    duplicateActivities: CareActivity[];
  }> {
    const { headers, data } = careActivitiesBulkDto;
    const errors: CareActivityBulkROError[] = [];

    // validate headers presence
    if (!Array.isArray(headers) || headers.length === 0 || headers.length > 1000) {
      throw new BadRequestException('Invalid headers');
    }

    // validate data presence
    if (!data.length) {
      errors.push({
        message: 'No care activities found',
      });
    }

    /** validate headers content */

    // fetch occupations
    const occupations = await this.occupationService.getAllOccupations();

    // Check for missing occupations (return as info, not error - user can choose to proceed)
    const missingOccupationNames = occupations
      .filter(occupation => !headers.includes(occupation.displayName))
      .map(o => o.displayName);

    // Build missing occupations info for response (not as error)
    let missingOccupationsInfo: MissingOccupationsInfo | undefined;
    if (missingOccupationNames.length > 0) {
      missingOccupationsInfo = {
        count: missingOccupationNames.length,
        names: missingOccupationNames,
      };
    }

    // Filter occupations to only those present in headers for permission validation
    const occupationsInHeaders = occupations.filter(o => headers.includes(o.displayName));

    const newOccupations = _.difference(
      _.difference(headers, Object.values(BULK_UPLOAD_COLUMNS)),
      occupations.map(o => o.displayName),
    );

    /** validate data content */

    // ** ensure all fields are non-empty
    const missingFieldsByColumn: Record<string, number[]> = {};

    const headerWithoutID = headers.slice(1);
    data.forEach(({ rowData, rowNumber }) => {
      headerWithoutID.forEach(header => {
        if (!rowData?.[header]) {
          if (!missingFieldsByColumn[header]) {
            missingFieldsByColumn[header] = [];
          }
          missingFieldsByColumn[header].push(rowNumber);
        }
      });
    });

    // Create separate error entries for each column with missing values
    Object.entries(missingFieldsByColumn).forEach(([columnName, rowNumbers]) => {
      errors.push({
        message: `Missing value in column "${columnName}"`,
        rowNumber: rowNumbers,
      });
    });

    // return if missing fields
    if (errors.length > 0) {
      return {
        result: { errors, total: data.length },
        duplicateActivities: [],
      };
    }

    // ** ensure care activity names are not duplicated in the supplied data
    const careActivitiesDataCount: Record<string, number> = {};
    data.forEach(c => {
      const activityName = c.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY];
      careActivitiesDataCount[activityName] = (careActivitiesDataCount[activityName] || 0) + 1;
    });

    const duplicateCareActivitiesData = Object.keys(careActivitiesDataCount).filter(
      name => careActivitiesDataCount[name] > 1,
    );

    duplicateCareActivitiesData.forEach(name => {
      const rowNumbers = data
        .filter(
          c => this.getNameFromDisplayName(c.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]) === name,
        )
        .map(c => c.rowNumber);

      // allow for different care settings (e.g. same activity in multiple bundles)
      // This is valid regardless of whether rows have IDs — after stale-ID stripping,
      // rows lose their IDs but still belong to distinct care settings.
      const activities = data.filter(a => a.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY] === name);
      const careSettings = activities.map(a => a.rowData[BULK_UPLOAD_COLUMNS.CARE_SETTING]);
      if (_.uniq(careSettings).length === activities.length) {
        return;
      }
      errors.push({
        message: `Duplicate care activity - ${name}`,
        rowNumber: rowNumbers,
      });
    });

    // ** ensure care activity, bundles, locations are strings
    const stringValueCareActivityErrorLineNumbers = new Set<number>();
    const stringValueCareBundleErrorLineNumbers = new Set<number>();
    const stringValueCareSettingErrorLineNumbers = new Set<number>();

    // ** ensure care activity type values from CareActivityType
    const allowedCareActivityTypes = Object.values(CareActivityType) as string[];
    const careActivityTypeEnumErrorLineNumbers = new Set<number>();

    // ** ensure occupation values are from BULK_UPLOAD_ALLOWED_PERMISSIONS
    // Only validate occupations that exist in headers (skip missing ones)
    const occupationNamesInHeaders = occupationsInHeaders.map(o => o.displayName);
    const occupationPermissionValueErrorLineNumbers = new Set<number>();

    data.forEach(({ rowData, rowNumber }) => {
      if (!(typeof rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY] === 'string')) {
        stringValueCareActivityErrorLineNumbers.add(rowNumber);
      }

      if (!(typeof rowData[BULK_UPLOAD_COLUMNS.CARE_BUNDLE] === 'string')) {
        stringValueCareBundleErrorLineNumbers.add(rowNumber);
      }

      if (!(typeof rowData[BULK_UPLOAD_COLUMNS.CARE_SETTING] === 'string')) {
        stringValueCareSettingErrorLineNumbers.add(rowNumber);
      }

      if (!allowedCareActivityTypes.includes(rowData[BULK_UPLOAD_COLUMNS.ASPECT_OF_PRACTICE])) {
        careActivityTypeEnumErrorLineNumbers.add(rowNumber);
      }

      occupationNamesInHeaders.forEach(o => {
        if (!BULK_UPLOAD_ALLOWED_PERMISSIONS.includes(rowData[o])) {
          occupationPermissionValueErrorLineNumbers.add(rowNumber);
          return;
        }
      });
    });

    if (stringValueCareActivityErrorLineNumbers.size > 0) {
      errors.push({
        message: `Care activity must be a string value`,
        rowNumber: Array.from(stringValueCareActivityErrorLineNumbers),
      });
    }

    if (stringValueCareBundleErrorLineNumbers.size > 0) {
      errors.push({
        message: `Care activity bundle must be a string value`,
        rowNumber: Array.from(stringValueCareBundleErrorLineNumbers),
      });
    }

    if (stringValueCareSettingErrorLineNumbers.size > 0) {
      errors.push({
        message: `Care setting must be a string value`,
        rowNumber: Array.from(stringValueCareSettingErrorLineNumbers),
      });
    }

    if (careActivityTypeEnumErrorLineNumbers.size > 0) {
      errors.push({
        message: `Aspect of practice must be one of ${allowedCareActivityTypes.join(', ')}`,
        rowNumber: Array.from(careActivityTypeEnumErrorLineNumbers),
      });
    }

    if (occupationPermissionValueErrorLineNumbers.size > 0) {
      errors.push({
        message: `Occupation scope must be one of ${BULK_UPLOAD_ALLOWED_PERMISSIONS.join(', ')}`,
        rowNumber: Array.from(occupationPermissionValueErrorLineNumbers),
      });
    }

    if (errors.length > 0) {
      return {
        result: { errors, total: data.length, missingOccupations: missingOccupationsInfo },
        duplicateActivities: [],
      };
    }

    // Check for duplicates in DB and get duplicate info + entities + missing IDs
    const { duplicateInfo, idErrors, duplicateActivities, missingIdsInfo } =
      await this.checkCareActivitiesUniq(data);
    errors.push(...idErrors);

    const countToAdd = data.filter(r => !r.rowData[BULK_UPLOAD_COLUMNS.ID]?.trim()).length;

    return {
      result: {
        errors,
        total: data.length,
        add: countToAdd,
        edit: data.length - countToAdd,
        newOccupations,
        duplicates: duplicateInfo,
        missingOccupations: missingOccupationsInfo,
        missingIds: missingIdsInfo,
      },
      duplicateActivities,
    };
  }

  /**
   *
   * Upload Care Activities Bulk
   *
   */
  async uploadCareActivitiesBulk(careActivitiesBulkDto: CareActivityBulkDTO) {
    const {
      duplicateHandling = DuplicateHandling.REJECT,
      proceedWithMissingOccupations,
      proceedWithStaleIds,
    } = careActivitiesBulkDto;

    // Run validation and get duplicate entities in one pass (avoids double DB query)
    const { result: validationResult, duplicateActivities } =
      await this.validateWithEntities(careActivitiesBulkDto);

    if (validationResult.errors.length > 0) {
      throw new BadRequestException(
        'There are some validation errors while confirming, please try again by reuploading the template',
      );
    }

    // Check for missing occupations - reject unless user explicitly chose to proceed
    if (validationResult.missingOccupations && validationResult.missingOccupations.count > 0) {
      if (!proceedWithMissingOccupations) {
        throw new BadRequestException(
          `Your template is missing ${validationResult.missingOccupations.count} occupation column(s): ${validationResult.missingOccupations.names.join(', ')}. Choose "Proceed anyway" to continue with these occupations set to "N" (no permission).`,
        );
      }
      // If proceedWithMissingOccupations is true, continue - missing columns will be treated as "N" implicitly
    }

    // Check for stale/missing IDs - reject unless user explicitly chose to proceed
    if (validationResult.missingIds && validationResult.missingIds.count > 0) {
      if (!proceedWithStaleIds) {
        throw new BadRequestException(
          `${validationResult.missingIds.count} activities have IDs that don't exist in this system. Choose "Strip IDs and add as new" to continue.`,
        );
      }
    }

    // Stage 1: Create data copy, stripping IDs from stale-ID rows if proceedWithStaleIds is true
    // Using immutable map instead of mutating the input DTO
    // Note: If frontend already stripped IDs before re-validation, missingIds will be
    // empty here and this is a no-op. This handles the direct upload path.
    const staleRowNumbers = new Set(validationResult.missingIds?.rowNumbers ?? []);
    let data = careActivitiesBulkDto.data.map(row => {
      if (proceedWithStaleIds && staleRowNumbers.has(row.rowNumber)) {
        return {
          ...row,
          rowData: { ...row.rowData, [BULK_UPLOAD_COLUMNS.ID]: '' },
        };
      }
      return row;
    });

    // TOCTOU fix: After stripping IDs, re-check those rows for duplicates
    // The original duplicateActivities was computed before IDs were stripped, so those rows
    // (which had IDs) were excluded from the duplicate check. Now they're "new" rows.
    let allDuplicateActivities = duplicateActivities;
    if (proceedWithStaleIds && validationResult.missingIds?.count) {
      const strippedRowNames = data
        .filter(r => staleRowNumbers.has(r.rowNumber))
        .map(r => this.getNameFromDisplayName(r.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]));

      if (strippedRowNames.length > 0) {
        const newDuplicates = await this.careActivityRepo.find({
          where: { name: In(strippedRowNames) },
        });

        if (newDuplicates.length > 0) {
          if (duplicateHandling === DuplicateHandling.REJECT) {
            throw new BadRequestException(
              `After stripping IDs, ${newDuplicates.length} activities now match existing records. Re-upload and choose how to handle duplicates.`,
            );
          }
          // Merge new duplicates for SKIP/UPDATE handling below (immutable)
          allDuplicateActivities = [
            ...duplicateActivities,
            ...newDuplicates.filter(nd => !duplicateActivities.some(da => da.id === nd.id)),
          ];
        }
      }
    }

    if (allDuplicateActivities.length > 0) {
      // Build Map for O(1) duplicate lookups (name → id)
      const duplicateNameToId = new Map(allDuplicateActivities.map(ca => [ca.name, ca.id]));

      switch (duplicateHandling) {
        case DuplicateHandling.REJECT:
          throw new BadRequestException(
            `${allDuplicateActivities.length} care activities already exist. Use "Skip duplicates" to add only new activities, or "Update existing" to update them.`,
          );

        case DuplicateHandling.SKIP:
          // Stage 2: Filter out rows that match existing activities (SKIP mode)
          data = data.filter(row => {
            const rowName = this.getNameFromDisplayName(
              row.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY],
            );
            return !duplicateNameToId.has(rowName);
          });
          break;

        case DuplicateHandling.UPDATE:
          // Stage 2: Add IDs to matching rows so they become updates (UPDATE mode)
          data = data.map(row => {
            const rowName = this.getNameFromDisplayName(
              row.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY],
            );
            const matchId = duplicateNameToId.get(rowName);
            if (matchId) {
              return {
                ...row,
                rowData: { ...row.rowData, [BULK_UPLOAD_COLUMNS.ID]: matchId },
              };
            }
            return row;
          });
          break;

        default:
          throw new BadRequestException(`Unknown duplicate handling option: ${duplicateHandling}`);
      }
    }

    // If all activities were skipped, return early (success with nothing to do)
    if (data.length === 0) {
      return;
    }

    // care settings and care bundles list definitions
    const careSettingDisplayNames = new Set<string>();
    const careBundleDisplayNames = new Set<string>();

    // loop all care activities, and create a list of care settings and care bundles
    data.forEach(({ rowData }) => {
      const careSetting = rowData[BULK_UPLOAD_COLUMNS.CARE_SETTING];
      const careBundle = rowData[BULK_UPLOAD_COLUMNS.CARE_BUNDLE];

      careSettingDisplayNames.add(this.trimDisplayName(careSetting));
      careBundleDisplayNames.add(this.trimDisplayName(careBundle));
    });

    // Note: These reference data upserts (care settings, bundles, occupations) happen outside
    // the transaction intentionally. They're idempotent and safe to persist even if the main
    // transaction fails - they represent valid reference data that can be reused.
    // upsert care settings (aka care locations) (aka Units)
    await this.unitService.saveCareLocations(Array.from(careSettingDisplayNames));
    const units = await this.unitService.getAllUnits();
    await this.unitService.saveCareLocations(
      Array.from(careSettingDisplayNames).filter(displayName =>
        units.every(u => u.name !== cleanText(displayName)),
      ),
    );

    // upsert care bundles
    await this.bundleService.upsertBundles(Array.from(careBundleDisplayNames));
    const bundles = await this.bundleService.getManyByNames(Array.from(careBundleDisplayNames));
    await this.bundleService.upsertBundles(
      Array.from(careBundleDisplayNames).filter(displayName =>
        bundles.every(b => b.name !== cleanText(displayName)),
      ),
    );

    const occupations = await this.occupationService.getAllOccupations();
    const newOccupations = _.difference(
      _.difference(careActivitiesBulkDto.headers, Object.values(BULK_UPLOAD_COLUMNS)),
      occupations.map(o => o.displayName),
    );
    if (newOccupations.length) {
      await this.occupationService.createByDisplayNames(newOccupations);
    }

    // Process care activities
    const partialCareActivities = await this.processCareActivities(
      data,
      careSettingDisplayNames,
      careBundleDisplayNames,
    );

    // Build pre-save maps keyed by cleanText(name) BEFORE save, because:
    // 1. M-M relations (careLocations) aren't guaranteed on TypeORM save() return
    // 2. CareActivity's @BeforeInsert hook transforms name via cleanText()
    // 3. bundle relation may not survive the save() round-trip
    // After save we remap by activity.id.
    const nameToUnitIds = new Map<string, Set<string>>();
    const nameToBundleId = new Map<string, string>();
    for (const partial of partialCareActivities) {
      const key = cleanText(partial.name);
      nameToUnitIds.set(key, new Set(partial.careLocations?.map(u => u.id) ?? []));
      if (partial.bundle?.id) {
        nameToBundleId.set(key, partial.bundle.id);
      }
    }

    // Fetch affected units before the transaction (units are already committed from saveCareLocations above)
    const affectedUnits = await this.unitService.getUnitsByNames(
      Array.from(careSettingDisplayNames),
    );

    // Wrap critical operations in a transaction to ensure atomicity
    // If any step fails, all changes are rolled back
    await this.careActivityRepo.manager.transaction(async manager => {
      // upsert care activities within transaction
      const activities = await manager.save(CareActivity, partialCareActivities);

      // Remap name-based mappings to ID-based for template sync
      const activityUnitMapping = new Map<string, Set<string>>();
      const activityBundleMapping = new Map<string, string>();
      for (const activity of activities) {
        const unitIds = nameToUnitIds.get(activity.name);
        if (unitIds) {
          activityUnitMapping.set(activity.id, unitIds);
        }
        const bundleId = nameToBundleId.get(activity.name);
        if (bundleId) {
          activityBundleMapping.set(activity.id, bundleId);
        }
      }

      // process allowed activities (see processAllowedActivities JSDoc for filtering behavior)
      const { allowedActivities, disallowedActivities } = await this.processAllowedActivities(
        data,
        activities,
        proceedWithMissingOccupations ? careActivitiesBulkDto.headers : undefined,
      );

      // upsert allowed activities within transaction (legacy — still used by Scope of Practice)
      if (allowedActivities.length) {
        await manager.upsert(
          AllowedActivity,
          allowedActivities.map(partial => manager.create(AllowedActivity, partial)),
          {
            skipUpdateIfNoValuesChanged: true,
            conflictPaths: ['careActivity', 'occupation', 'unit'],
          },
        );
      }

      // remove disallowed activities within transaction (legacy)
      if (disallowedActivities.length) {
        const chunks = _.chunk(disallowedActivities, 20);
        for (const chunk of chunks) {
          await Promise.all(
            chunk.map(activity =>
              manager.delete(AllowedActivity, {
                careActivity: activity.careActivity,
                occupation: activity.occupation,
                unit: activity.unit,
              }),
            ),
          );
        }
      }

      // Sync to template system — ensures CMS display and planning sessions see bulk-uploaded data
      const templatesByUnitId = await this.careSettingTemplateService.findOrCreateMasterTemplates(
        manager,
        affectedUnits,
      );

      await this.careSettingTemplateService.syncBulkUploadToTemplates(
        manager,
        templatesByUnitId,
        activities,
        activityUnitMapping,
        activityBundleMapping,
        allowedActivities,
        disallowedActivities,
      );
    });
  }

  /**
   *
   * Process Care Activities
   *
   */
  async processCareActivities(
    data: CareActivityBulkData[],
    careSettingDisplayNames: Set<string>,
    careBundleDisplayNames: Set<string>,
  ) {
    const careActivityIds = data.map(e => e.rowData[BULK_UPLOAD_COLUMNS.ID]).filter(Boolean);
    const existingActivities = careActivityIds.length
      ? await this.careActivityRepo.find({
          where: {
            id: In(data.map(e => e.rowData[BULK_UPLOAD_COLUMNS.ID]).filter(Boolean)),
          },
          relations: ['careLocations'],
        })
      : [];
    // fetch care setting entities from database for relational mapping purposes with care activities
    const careSettingEntities = await this.unitService.getUnitsByNames(
      Array.from(careSettingDisplayNames),
    );

    // fetch bundle entities from database for relational mapping purposes with care activities
    const bundleEntities = await this.bundleService.getManyByNames(
      Array.from(careBundleDisplayNames),
    );

    // care activity object to be upserted
    const careActivities: Map<string, CareActivity> = new Map();
    data.forEach(({ rowData }) => {
      const displayName = rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY];
      const activityType = rowData[BULK_UPLOAD_COLUMNS.ASPECT_OF_PRACTICE] as CareActivityType;
      const careSetting = rowData[BULK_UPLOAD_COLUMNS.CARE_SETTING];
      const careBundle = rowData[BULK_UPLOAD_COLUMNS.CARE_BUNDLE];

      const careSettingEntity = careSettingEntities.find(
        entity => entity.name === this.getNameFromDisplayName(careSetting),
      );
      const bundle = bundleEntities.find(
        entity => entity.name === this.getNameFromDisplayName(careBundle),
      );

      if (!careSettingEntity || !bundle) {
        // ideally code should never reach this error. At this point, both careSetting and bundle from the sheet should have been upserted
        // New ones should have been inserted in previous step. If still not, verify the names and cleanText names
        this.logger.error(
          `Something went wrong processing care activity - Care setting / bundle not found in db - careActivity: ${displayName}, careBundle: ${careBundle}, careSetting: ${careSetting}`,
        );
        throw new UnprocessableEntityException(
          `Something went wrong processing care activity - ${displayName}`,
        );
      }

      const id = rowData[BULK_UPLOAD_COLUMNS.ID];

      // search cache(careActivities) first, then database. if not found, create a new one
      const activity =
        careActivities.get(cleanText(displayName)) ??
        existingActivities.find(a => a.id === id) ??
        this.careActivityRepo.create();

      activity.activityType = activityType;
      activity.name = displayName;
      activity.displayName = displayName;
      activity.bundle = bundle;
      if (!activity.careLocations?.length) {
        activity.careLocations = [careSettingEntity];
      } else if (!activity.careLocations.some(l => l.id === careSettingEntity.id)) {
        activity.careLocations.push(careSettingEntity);
      }
      careActivities.set(cleanText(displayName), activity);
    });

    return Array.from(careActivities.values());
  }

  /**
   *
   * Process Allowed Activities
   *
   * @param headers - Optional. When provided, only occupations present in headers will be processed.
   *                  This prevents deletion of existing permissions for occupations not in the template
   *                  (used when proceedWithMissingOccupations is true).
   */
  async processAllowedActivities(
    data: CareActivityBulkData[],
    careActivities: CareActivity[],
    headers?: string[],
  ) {
    // fetch occupations
    const allOccupations = await this.occupationService.getAllOccupations();

    // Filter to only occupations in headers if headers provided (see JSDoc above)
    const occupations = headers
      ? allOccupations.filter(o => headers.includes(o.displayName))
      : allOccupations;

    const unitEntities = _.keyBy(await this.unitService.getAllUnits(), 'displayName');

    // care activity - allowed activity mapping; keys - activity-unit-occupation
    const allowedActivityMapping: Map<string, Map<string, Map<string, Permissions>>> = new Map();

    // care activity - allowed activity mapping; keys - activity-unit
    const disallowedActivityMapping: Map<string, Map<string, string[]>> = new Map();

    // loop all care activities, and map values
    data.forEach(({ rowData }) => {
      const careActivity = rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY];
      const unitName = rowData[BULK_UPLOAD_COLUMNS.CARE_SETTING];
      const careActivityDisplayName = this.trimDisplayName(careActivity);

      // if mapping does not exist, create
      if (!allowedActivityMapping.has(careActivityDisplayName)) {
        allowedActivityMapping.set(careActivityDisplayName, new Map());
      }
      if (!allowedActivityMapping.get(careActivityDisplayName)?.get(unitName)) {
        allowedActivityMapping.get(careActivityDisplayName)?.set(unitName, new Map());
      }

      // loop all occupations, and map values
      occupations.forEach(occupation => {
        const permission = rowData[occupation.displayName];
        const occupationDisplayName = occupation.displayName;

        // Only 'Y' (PERFORM) and 'LC' (LIMITS) are allowed in the database
        // 'N' and any other value should be treated as disallowed (remove from allowed_activity table)
        const isAllowed = permission === Permissions.PERFORM || permission === Permissions.LIMITS;

        if (!isAllowed) {
          if (!disallowedActivityMapping.has(careActivityDisplayName)) {
            disallowedActivityMapping.set(careActivityDisplayName, new Map());
          }
          if (!disallowedActivityMapping.get(careActivityDisplayName)?.get(unitName)) {
            disallowedActivityMapping.get(careActivityDisplayName)?.set(unitName, []);
          }
          disallowedActivityMapping
            .get(careActivityDisplayName)
            ?.get(unitName)
            ?.push(occupationDisplayName);
          return;
        }

        allowedActivityMapping
          .get(careActivityDisplayName)
          ?.get(unitName)
          ?.set(occupationDisplayName, permission as Permissions);
      });
    });

    // care activity map as helper - so we don't have to perform find operation every time
    const careActivityMap: Map<string, CareActivity> = new Map();

    // fill in care activity map helper
    careActivities.forEach(careActivity => {
      const displayName = careActivity.displayName;
      if (!careActivityMap.has(displayName)) {
        careActivityMap.set(displayName, careActivity);
      }
    });

    // occupation map as helper - so we don't have to perform find operation every time
    const occupationMap: Map<string, Occupation> = new Map();

    // fill in occupation map helper
    occupations.forEach(occupation => {
      const occupationDisplayName = occupation.displayName;
      if (!occupationMap.get(occupationDisplayName)) {
        occupationMap.set(occupationDisplayName, occupation);
      }
    });

    // allowed activity object to be upserted
    const allowedActivities: Partial<AllowedActivity>[] = [];

    // process mapping
    Array.from(allowedActivityMapping.keys()).forEach(careActivityDisplayName => {
      const mapByActivity = allowedActivityMapping.get(careActivityDisplayName);

      if (!mapByActivity) return;
      Array.from(mapByActivity.keys())
        .sort()
        .forEach(unitName => {
          const mapByUnit = mapByActivity.get(unitName);
          if (!mapByUnit) return;
          Array.from(mapByUnit.keys())
            .sort()
            .forEach(occupationDisplayName => {
              const permission = mapByUnit.get(occupationDisplayName);
              const occupation = occupationMap.get(occupationDisplayName);
              const careActivity = careActivityMap.get(careActivityDisplayName);
              const unit = unitEntities[unitName];

              allowedActivities.push({ permission, occupation, careActivity, unit });
            });
        });
    });

    const disallowedActivities: Partial<AllowedActivity>[] = [];
    Array.from(disallowedActivityMapping.keys()).forEach(careActivityDisplayName => {
      const mapByUnit = disallowedActivityMapping.get(careActivityDisplayName);
      if (!mapByUnit) return;
      Array.from(mapByUnit.keys()).forEach(unitName => {
        const occupations = mapByUnit.get(unitName);
        occupations?.sort().forEach(occupationDisplayName => {
          const occupation = occupationMap.get(occupationDisplayName);
          const careActivity = careActivityMap.get(careActivityDisplayName);
          const unit = unitEntities[unitName];
          disallowedActivities.push({ occupation, careActivity, unit });
        });
      });
    });

    return { allowedActivities, disallowedActivities };
  }

  async downloadCareActivities() {
    const activities = await this.careActivityRepo.find({
      relations: [
        'bundle',
        'careLocations',
        'allowedActivities',
        'allowedActivities.occupation',
        'allowedActivities.unit',
      ],
    });

    const occupations = await this.occupationService.getAllOccupations();

    const activitiesBySetting = activities
      .filter(a => a.careLocations.length)
      .map(a => {
        const unit = a.careLocations[0];
        const activity: Record<string, string> = {
          [BULK_UPLOAD_COLUMNS.ID]: a.id,
          [BULK_UPLOAD_COLUMNS.CARE_SETTING]: unit.displayName,
          [BULK_UPLOAD_COLUMNS.CARE_BUNDLE]: a.bundle.displayName,
          [BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]: a.displayName,
          [BULK_UPLOAD_COLUMNS.ASPECT_OF_PRACTICE]: a.activityType,
        };
        _.sortBy(occupations, 'displayName').forEach(o => {
          const allowedActivity = a.allowedActivities.find(
            aa => aa.occupation?.id === o.id && aa.unit?.id === unit.id,
          );
          activity[o.displayName] = allowedActivity?.permission ?? 'N';
        });
        return activity;
      });

    // duplicate activities for different unit
    activities
      .filter(a => a.careLocations.length > 1)
      .forEach(a => {
        const index = activitiesBySetting.findIndex(
          e => e[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY] === a.displayName,
        );
        const activity = activitiesBySetting[index];
        const duplicates = a.careLocations.slice(1).map(unit => {
          const duplicate: Record<string, string> = {
            ...activity,
            [BULK_UPLOAD_COLUMNS.CARE_SETTING]: unit.displayName,
          };
          _.sortBy(occupations, 'displayName').forEach(o => {
            const allowedActivity = a.allowedActivities.find(
              aa => aa.occupation?.id === o.id && aa.unit?.id === unit.id,
            );
            duplicate[o.displayName] = allowedActivity?.permission ?? 'N';
          });
          return duplicate;
        });
        activitiesBySetting.splice(index + 1, 0, ...duplicates);
      });

    return activitiesBySetting;
  }
}
