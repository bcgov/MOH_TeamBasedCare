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
  Permissions,
} from '@tbcm/common';
import { OccupationService } from 'src/occupation/occupation.service';
import { InjectRepository } from '@nestjs/typeorm';
import { CareActivity } from './entity/care-activity.entity';
import { In, Repository } from 'typeorm';
import { cleanText } from 'src/common/utils';
import { UnitService } from 'src/unit/unit.service';
import { BundleService } from './bundle.service';
import { CareActivityService } from './care-activity.service';
import { Occupation } from 'src/occupation/entity/occupation.entity';
import { AllowedActivity } from 'src/allowed-activity/entity/allowed-activity.entity';
import { AllowedActivityService } from 'src/allowed-activity/allowed-activity.service';
import { AppLogger } from 'src/common/logger.service';

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

    @Inject(CareActivityService)
    private readonly careActivityService: CareActivityService,

    @Inject(AllowedActivityService)
    private readonly allowedActivityService: AllowedActivityService,
  ) {}

  trimDisplayName(displayName: string): string {
    return displayName.toString().trim().replace(/"/g, '');
  }

  getNameFromDisplayName(displayName: string): string {
    return cleanText(this.trimDisplayName(displayName));
  }

  async validateCareActivitiesBulk(
    careActivitiesBulkDto: CareActivityBulkDTO,
    isEditing = false,
  ): Promise<CareActivityBulkRO> {
    const { headers, data } = careActivitiesBulkDto;
    const errors: CareActivityBulkROError[] = [];

    // validate headers presence
    if (!headers.length) {
      errors.push({
        message: 'No headers found',
      });
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

    // ensure all occupations' exists in headers; ensuring no tampering of data
    if (!occupations.every(occupation => headers.includes(occupation.displayName))) {
      errors.push({
        message: 'One or more occupations not found in headers',
      });
    }

    /** validate data content */

    // ** ensure all fields are non-empty
    const missingFieldRows = new Set<number>();
    const idFieldErrorRows = new Set<number>(); // id fields when uploading data should be empty

    data.forEach(({ rowData, rowNumber }) => {
      headers.forEach(header => {
        // id fields when uploading data should be empty
        if (header === BULK_UPLOAD_COLUMNS.ID && !isEditing) {
          if (rowData?.[header]) {
            idFieldErrorRows.add(rowNumber);
          }
          return;
        }

        if (!rowData?.[header]) {
          missingFieldRows.add(rowNumber);
          return;
        }
      });
    });

    if (idFieldErrorRows.size > 0) {
      errors.push({
        message: 'ID fields should be empty when uploading new data',
        rowNumber: Array.from(idFieldErrorRows),
      });
    }

    if (missingFieldRows.size > 0) {
      errors.push({
        message: 'Missing inputs',
        rowNumber: Array.from(missingFieldRows),
      });
    }

    // return if missing fields
    if (errors.length > 0) {
      return { errors, careActivitiesCount: data.length };
    }

    // ** ensure care activity names are not duplicated in the supplied data
    const careActivitiesDataCount: Record<string, number> = {};
    data.forEach(c => {
      const caName = this.getNameFromDisplayName(c.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]);
      careActivitiesDataCount[caName] = (careActivitiesDataCount[caName] || 0) + 1;
    });

    const duplicateCareActivitiesData = Object.keys(careActivitiesDataCount).filter(
      caName => careActivitiesDataCount[caName] > 1,
    );

    duplicateCareActivitiesData.forEach(caName => {
      let caDisplayName = '';
      const rowNumbers = data
        .filter(
          c => this.getNameFromDisplayName(c.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]) === caName,
        )
        .map(c => {
          if (!caDisplayName) {
            caDisplayName = c.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY];
          }
          return c.rowNumber;
        });
      errors.push({
        message: `Duplicate care activity - ${caDisplayName}`,
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
    const occupationNames = occupations.map(o => o.displayName);
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

      occupationNames.forEach(o => {
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
      return { errors, careActivitiesCount: data.length };
    }

    if (!isEditing) {
      await this.validateCareActivitiesUpload(data, errors);
    }

    return { errors, careActivitiesCount: data.length };
  }

  async validateCareActivitiesUpload(
    data: CareActivityBulkData[],
    errors: CareActivityBulkROError[],
  ) {
    // This method assumes all column values exist in the rowData array

    // ** ensure care activity names are not duplicated in the database
    const duplicateCareActivitiesDb = await this.careActivityRepo.find({
      where: {
        name: In(
          data.map(c => this.getNameFromDisplayName(c.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY])),
        ),
      },
    });

    // return as errors for duplicate care activities
    duplicateCareActivitiesDb.forEach(ca => {
      const rowNumber = data.find(
        c => this.getNameFromDisplayName(c.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY]) === ca.name,
      )!.rowNumber;

      errors.push({
        message: `Care Activity already exists in the system - ${ca.displayName}`,
        rowNumber: [rowNumber],
      });
    });
  }

  /**
   *
   * Upload Care Activities Bulk
   *
   */
  async uploadCareActivitiesBulk(careActivitiesBulkDto: CareActivityBulkDTO, isEditing = false) {
    const { errors: validationErrors } = await this.validateCareActivitiesBulk(
      careActivitiesBulkDto,
      isEditing,
    );

    if (validationErrors.length > 0) {
      throw new BadRequestException(
        'There are some validation errors while confirming, please try again by reuploading the template',
      );
    }

    // extract data
    const { data } = careActivitiesBulkDto;

    // care settings and care bundles list definitions
    const careSettingDisplayNames = new Set<string>();
    const careBundleDisplayNames = new Set<string>();
    const careActivityDisplayNames = new Set<string>();

    // loop all care activities, and create a list of care settings and care bundles
    data.forEach(({ rowData }) => {
      const careSetting = rowData[BULK_UPLOAD_COLUMNS.CARE_SETTING];
      const careBundle = rowData[BULK_UPLOAD_COLUMNS.CARE_BUNDLE];
      const careActivity = rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY];

      careSettingDisplayNames.add(this.trimDisplayName(careSetting));
      careBundleDisplayNames.add(this.trimDisplayName(careBundle));
      careActivityDisplayNames.add(this.trimDisplayName(careActivity));
    });

    // upsert care settings (aka care locations) (aka Units)
    await this.unitService.saveCareLocations(Array.from(careSettingDisplayNames));

    // upsert care bundles
    await this.bundleService.upsertBundles(Array.from(careBundleDisplayNames));

    // Process care activities
    const partialCareActivities = await this.processCareActivities(
      data,
      careSettingDisplayNames,
      careBundleDisplayNames,
    );

    // upsert care activities
    await this.careActivityService.saveCareActivities(partialCareActivities);

    // process allowed activity
    const allowedActivities = await this.processAllowedActivities(data, careActivityDisplayNames);

    // upsert allowed activities
    await this.allowedActivityService.upsertAllowedActivities(allowedActivities);
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
    // fetch care setting entities from database for relational mapping purposes with care activities
    const careSettingEntities = await this.unitService.getUnitsByNames(
      Array.from(careSettingDisplayNames),
    );

    // fetch bundle entities from database for relational mapping purposes with care activities
    const bundleEntities = await this.bundleService.getManyByNames(
      Array.from(careBundleDisplayNames),
    );

    // care activity object to be upserted
    const partialCareActivities: Partial<CareActivity>[] = [];

    // loop all care activities, and create care activity processable entity
    data.forEach(({ rowData }) => {
      const careActivity = rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY];
      const activityType = rowData[BULK_UPLOAD_COLUMNS.ASPECT_OF_PRACTICE] as CareActivityType;
      const careSetting = rowData[BULK_UPLOAD_COLUMNS.CARE_SETTING];
      const careBundle = rowData[BULK_UPLOAD_COLUMNS.CARE_BUNDLE];

      const careSettingEntity = careSettingEntities.find(
        entity => entity.name === this.getNameFromDisplayName(careSetting),
      );
      const bundleEntity = bundleEntities.find(
        entity => entity.name === this.getNameFromDisplayName(careBundle),
      );

      if (!careSettingEntity || !bundleEntity) {
        // ideally code should never reach this error. At this point, both careSetting and bundle from the sheet should have been upserted
        // New ones should have been inserted in previous step. If still not, verify the names and cleanText names
        this.logger.error(
          `Something went wrong processing care activity - Care setting / bundle not found in db - careActivity: ${careActivity}, careBundle: ${careBundle}, careSetting: ${careSetting}`,
        );
        throw new UnprocessableEntityException(
          `Something went wrong processing care activity - ${careActivity}`,
        );
      }

      partialCareActivities.push({
        name: careActivity,
        activityType,
        bundle: bundleEntity,
        careLocations: [careSettingEntity],
      });
    });

    return partialCareActivities;
  }

  /**
   *
   * Process Allowed Activities
   *
   */
  async processAllowedActivities(
    data: CareActivityBulkData[],
    careActivityDisplayNames: Set<string>,
  ) {
    // fetch occupations
    const occupations = await this.occupationService.getAllOccupations();

    // care activity - allowed activity mapping
    const careActivityAllowedActivityMapping: Record<
      string,
      { [occupation: string]: Permissions }
    > = {};

    // loop all care activities, and map values
    data.forEach(({ rowData }) => {
      const careActivity = rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY];
      const careActivityDisplayName = this.trimDisplayName(careActivity);

      // if mapping does not exist, create
      if (!careActivityAllowedActivityMapping[careActivityDisplayName]) {
        careActivityAllowedActivityMapping[careActivityDisplayName] = {};
      }

      // loop all occupations, and map values
      occupations.forEach(occupation => {
        const permission = rowData[occupation.displayName];
        const occupationDisplayName = occupation.displayName;

        // ignore not allowed activity ['N']
        if (!(Object.values(Permissions) as string[]).includes(permission)) {
          // TODO when enabling edit: when 'N', remove allowed activities in db, if available
          // For now, when adding a record, no action is required
          return;
        }

        careActivityAllowedActivityMapping[careActivityDisplayName][occupationDisplayName] =
          permission as Permissions;
      });
    });

    // fetch care activities from database for relational mapping purposes with allowed activities
    const careActivityEntities = await this.careActivityService.getManyByNames(
      Array.from(careActivityDisplayNames),
    );

    // care activity map as helper - so we don't have to perform find operation every time
    const careActivityMap: Record<string, CareActivity> = {};

    // fill in care activity map helper
    careActivityEntities.forEach(careActivity => {
      const careActivityDisplayName = careActivity.displayName;
      if (!careActivityMap[careActivityDisplayName]) {
        careActivityMap[careActivityDisplayName] = careActivity;
      }
    });

    // occupation map as helper - so we don't have to perform find operation every time
    const occupationMap: Record<string, Occupation> = {};

    // fill in occupation map helper
    occupations.forEach(occupation => {
      const occupationDisplayName = occupation.displayName;
      if (!occupationMap[occupationDisplayName]) {
        occupationMap[occupationDisplayName] = occupation;
      }
    });

    // allowed activity object to be upserted
    const allowedActivities: Partial<AllowedActivity>[] = [];

    // process mapping
    Object.keys(careActivityAllowedActivityMapping).forEach(careActivityDisplayName => {
      const mapping = careActivityAllowedActivityMapping[careActivityDisplayName];

      Object.keys(mapping).forEach(occupationDisplayName => {
        const permission = mapping[occupationDisplayName];
        const occupation = occupationMap[occupationDisplayName];
        const careActivity = careActivityMap[careActivityDisplayName];

        allowedActivities.push({ permission, occupation, careActivity });
      });
    });

    return allowedActivities;
  }
}
