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
  ): Promise<CareActivityBulkRO> {
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

    // ensure all occupations' exists in headers; ensuring no tampering of data
    if (!occupations.every(occupation => headers.includes(occupation.displayName))) {
      errors.push({
        message: 'One or more occupations not found in headers',
      });
    }

    const newOccupations = _.difference(
      _.difference(headers, Object.values(BULK_UPLOAD_COLUMNS)),
      occupations.map(o => o.displayName),
    );

    /** validate data content */

    // ** ensure all fields are non-empty
    const missingFieldRows = new Set<number>();

    const headerWithoutID = headers.slice(1);
    data.forEach(({ rowData, rowNumber }) => {
      headerWithoutID.forEach(header => {
        if (!rowData?.[header]) {
          missingFieldRows.add(rowNumber);
          return;
        }
      });
    });

    if (missingFieldRows.size > 0) {
      errors.push({
        message: 'Missing inputs',
        rowNumber: Array.from(missingFieldRows),
      });
    }

    // return if missing fields
    if (errors.length > 0) {
      return { errors, total: data.length };
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

      // allow for different care setting
      const activities = data.filter(a => a.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY] === name);
      if (activities.every(a => a.rowData[BULK_UPLOAD_COLUMNS.ID])) {
        const careSettings = activities.map(a => a.rowData[BULK_UPLOAD_COLUMNS.CARE_SETTING]);
        if (_.uniq(careSettings).length === activities.length) {
          return;
        }
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
      return { errors, total: data.length };
    }

    await this.checkCareActivitiesUniq(data, errors);

    const countToAdd = data.filter(r => !r.rowData[BULK_UPLOAD_COLUMNS.ID]?.trim()).length;

    return {
      errors,
      total: data.length,
      add: countToAdd,
      edit: data.length - countToAdd,
      newOccupations,
    };
  }

  async checkCareActivitiesUniq(data: CareActivityBulkData[], errors: CareActivityBulkROError[]) {
    // This method assumes all column values exist in the rowData array

    // validate rows with ID
    let activities: CareActivity[];
    try {
      activities = await this.careActivityRepo.find({
        where: {
          id: In(data.map(row => row.rowData[BULK_UPLOAD_COLUMNS.ID]?.trim()).filter(Boolean)),
        },
      });
    } catch (e) {
      errors.push({
        message: `ID must be empty for new care activities or should not be modified.`,
      });
      return;
    }
    const missingIds = _.difference(
      data.map(row => row.rowData[BULK_UPLOAD_COLUMNS.ID]).filter(Boolean),
      activities.map(e => e.id),
    );
    missingIds.forEach(id => {
      const rowNumber = data.find(c => c.rowData[BULK_UPLOAD_COLUMNS.ID])!.rowNumber;
      errors.push({
        message: `Care Activity not found - ${id}`,
        rowNumber: [rowNumber],
      });
    });

    // ** ensure care activity names are not duplicated in the database
    const duplicateCareActivitiesDb = await this.careActivityRepo.find({
      where: {
        name: In(
          data
            .filter(row => !row.rowData.ID?.trim())
            .map(c => this.getNameFromDisplayName(c.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY])),
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
  async uploadCareActivitiesBulk(careActivitiesBulkDto: CareActivityBulkDTO) {
    const { errors: validationErrors } = await this.validateCareActivitiesBulk(
      careActivitiesBulkDto,
    );

    if (validationErrors.length > 0) {
      throw new BadRequestException(
        'There are some validation errors while confirming, please try again by reuploading the template',
      );
    }
    if (
      !Array.isArray(careActivitiesBulkDto.headers) ||
      careActivitiesBulkDto.headers.length > 1000
    ) {
      throw new BadRequestException(
        'Invalid headers: must be an array with a maximum length of 1000',
      );
    }

    // extract data
    const { data } = careActivitiesBulkDto;

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

    // upsert care activities
    const activities = await this.careActivityService.saveCareActivities(partialCareActivities);

    // process allowed activity
    const { allowedActivities, disallowedActivities } = await this.processAllowedActivities(
      data,
      activities,
    );

    // upsert allowed activities
    if (allowedActivities.length) {
      await this.allowedActivityService.upsertAllowedActivities(allowedActivities);
    }
    if (disallowedActivities.length) {
      await this.allowedActivityService.removeAllowedActivities(disallowedActivities);
    }
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
   */
  async processAllowedActivities(data: CareActivityBulkData[], careActivities: CareActivity[]) {
    // fetch occupations
    const occupations = await this.occupationService.getAllOccupations();

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

        // ignore not allowed activity ['N']
        if (!(Object.values(Permissions) as string[]).includes(permission)) {
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
            aa => aa.occupation.id === o.id && aa.unit.id === unit.id,
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
              aa => aa.occupation.id === o.id && aa.unit.id === unit.id,
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
