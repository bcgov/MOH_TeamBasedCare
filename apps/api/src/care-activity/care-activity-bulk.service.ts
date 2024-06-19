import { Inject, Injectable } from '@nestjs/common';
import {
  BULK_UPLOAD_ALLOWED_PERMISSIONS,
  BULK_UPLOAD_COLUMNS,
  CareActivityBulkData,
  CareActivityBulkDTO,
  CareActivityBulkRO,
  CareActivityBulkROError,
  CareActivityType,
} from '@tbcm/common';
import { OccupationService } from 'src/occupation/occupation.service';
import { InjectRepository } from '@nestjs/typeorm';
import { CareActivity } from './entity/care-activity.entity';
import { In, Repository } from 'typeorm';
import { cleanText } from 'src/common/utils';

@Injectable()
export class CareActivityBulkService {
  constructor(
    @InjectRepository(CareActivity)
    private readonly careActivityRepo: Repository<CareActivity>,

    @Inject(OccupationService)
    private readonly occupationService: OccupationService,
  ) {}

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
      const caName = c.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY];
      careActivitiesDataCount[caName] = (careActivitiesDataCount[caName] || 0) + 1;
    });

    const duplicateCareActivitiesData = Object.keys(careActivitiesDataCount).filter(
      caName => careActivitiesDataCount[caName] > 1,
    );

    duplicateCareActivitiesData.forEach(caName => {
      const rowNumbers = data
        .filter(c => c.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY] === caName)
        .map(c => c.rowNumber);
      errors.push({
        message: `Duplicate care activity - ${caName}`,
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
        name: In(data.map(c => cleanText(c.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY].toString()))),
      },
    });

    // return as errors for duplicate care activities
    duplicateCareActivitiesDb.forEach(ca => {
      const rowNumber = data.find(
        c => cleanText(c.rowData[BULK_UPLOAD_COLUMNS.CARE_ACTIVITY].toString()) === ca.name,
      )!.rowNumber;

      errors.push({
        message: `Care Activity already exists in the system - ${ca.displayName}`,
        rowNumber: [rowNumber],
      });
    });
  }
}
