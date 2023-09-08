import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppLogger } from '../../common/logger.service';
import csv from 'csv-parser';
import { AllowedActivity } from '../../entities/allowed-activities.entity';
import { cleanText } from '../../common/utils';
import { Bundle } from '../../care-activity/entity/bundle.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CareActivity } from '../../care-activity/entity/care-activity.entity';
import { Occupation } from 'src/occupation/entity/occupation.entity';
import { CareActivityType, ClinicalType, Permissions } from '../../common/constants';
import { Readable } from 'stream';
import { Unit } from '../../unit/entity/unit.entity';
import { UnitService } from 'src/unit/unit.service';

@Injectable()
export class SeedService {
  constructor(
    @Inject(Logger) private readonly logger: AppLogger,
    @InjectRepository(Bundle)
    private readonly bundleRepo: Repository<Bundle>,
    @InjectRepository(CareActivity)
    private readonly careActivityRepo: Repository<CareActivity>,
    @InjectRepository(Occupation)
    private readonly occupationRepo: Repository<Occupation>,
    @InjectRepository(AllowedActivity)
    private readonly allowedActRepo: Repository<AllowedActivity>,
    @Inject(UnitService)
    private readonly unitService: UnitService,
  ) {}

  async updateOccupations(file: Buffer): Promise<void> {
    let headers: string[];
    const occupations: { name: string; isRegulated: boolean }[] = [];

    const readable = new Readable();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    readable._read = () => {}; // _read is required but you can noop it
    readable.push(file);
    readable.push(null);

    readable
      .pipe(csv())
      .on('data', data => {
        if (!headers) {
          headers = Object.keys(data);
        }
        const name = data[headers[0]].trim().replace(/"/g, '');
        const isRegulated = data[headers[1]].trim().replace(/"/g, '') === 'Regulated';
        occupations.push({ name, isRegulated });
      })
      .on('end', async () => {
        // Save the result

        await this.occupationRepo
          .createQueryBuilder()
          .insert()
          .into(Occupation)
          .values(
            occupations.map(({ name, isRegulated }) => {
              return this.occupationRepo.create({
                name,
                isRegulated,
              });
            }),
          )
          .orIgnore()
          .execute();
      });
  }

  async updateCareActivities(file: Buffer): Promise<void> {
    let headers: string[];
    const bundleVsCareActivity: {
      [key: string]: {
        name: string;
        activityType: CareActivityType;
        clinicalType: ClinicalType;
        careLocation: string;
      }[];
    } = {};
    const occupationVsCareActivity: { [key: string]: { [key: string]: Permissions } } = {};
    const careLocations = new Set<string>();

    let bundleName: string;

    const readable = new Readable();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    readable._read = () => {}; // _read is required but you can noop it
    readable.push(file);
    readable.push(null);

    readable
      .pipe(csv())
      .on('data', data => {
        if (!headers) {
          headers = Object.keys(data);
        }
        bundleName = (!data[headers[1]] ? bundleName : data[headers[1]]).trim().replace(/"/g, '');
        const activityName = data[headers[2]].trim().replace(/"/g, '');
        const careLocation = data[headers[0]].trim().replace(/"/g, '');
        careLocations.add(careLocation);

        let activityList: {
          name: string;
          activityType: CareActivityType;
          clinicalType: ClinicalType;
          careLocation: string;
        }[] = [];

        if (bundleName in bundleVsCareActivity) {
          activityList = bundleVsCareActivity[bundleName];
        }
        const activityType = data[headers[headers.length - 1]].trim().replace(/"/g, '');
        const clinicalType = data[headers[headers.length - 2]].trim().replace(/"/g, '');

        activityList.push({ name: activityName, activityType, clinicalType, careLocation });
        bundleVsCareActivity[bundleName] = activityList;
        for (let index = 3; index < headers.length - 2; index++) {
          const e = headers[index];
          let action: string = data[e];
          let allowedAction;
          if (action?.length > 0) {
            action = cleanText(action);
            if (action.includes('x')) {
              allowedAction = Permissions.PERFORM;
            } else if (action.includes('a')) {
              allowedAction = Permissions.ASSIST;
            } else if (action.includes('c')) {
              allowedAction = Permissions.CONTINUED_EDUCATION;
            } else if (action.includes('l')) {
              allowedAction = Permissions.LIMITS;
            }
          }

          if (allowedAction) {
            if (!occupationVsCareActivity[e]) {
              occupationVsCareActivity[e] = {};
            }
            occupationVsCareActivity[e][cleanText(activityName)] = allowedAction;
          }
        }
      })
      .on('end', async () => {
        // Save the result

        // save care locations (aka Units)
        await this.unitService.saveCareLocations(Array.from(careLocations));

        const consolidatedCareActivities: {
          name: string;
          activityType: CareActivityType;
          clinicalType: ClinicalType;
          careLocation: string;
        }[] = Object.values(bundleVsCareActivity).flat(1);

        const careLocationNames = new Set<string>();

        consolidatedCareActivities
          .filter(ca => 'careLocation' in ca)
          .forEach(ca => careLocationNames.add(ca.careLocation));

        // get locations DB mapping
        const careLocationsDbByNames = await this.unitService.getUnitsByNames(
          Array.from(careLocationNames),
        );

        await Promise.allSettled(
          Object.entries(bundleVsCareActivity).map(([bundleName, careActivities]) => {
            const careActivitiesWithUnit: {
              name: string;
              activityType: CareActivityType;
              clinicalType: ClinicalType;
              careLocation: Unit | undefined;
            }[] = [];

            careActivities.forEach(ca => {
              careActivitiesWithUnit.push({
                ...ca,
                careLocation: careLocationsDbByNames.find(
                  _ => _.name === cleanText(ca.careLocation),
                ),
              });
            });

            return this.saveCareActivity(bundleName, careActivitiesWithUnit);
          }),
        );

        const consolidatedCareActivitiesName: string[] = consolidatedCareActivities.map(
          careActivity => cleanText(careActivity.name),
        );

        //Delete object to free-up space
        Object.keys(bundleVsCareActivity).forEach(key => {
          delete bundleVsCareActivity[key];
        });

        const careActivityDBMap: { [key: string]: CareActivity } = {};

        (await this.findAllCareActivities(consolidatedCareActivitiesName)).forEach(eachCA => {
          careActivityDBMap[eachCA.name] = eachCA;
        });

        await Promise.allSettled(
          Object.entries(occupationVsCareActivity).map(([occupationName, activityMap]) => {
            return this.saveAllowedActivity(occupationName, activityMap, careActivityDBMap);
          }),
        );
      });
  }

  private async findAllCareActivities(careActivities: string[]): Promise<CareActivity[]> {
    return this.careActivityRepo.find({
      where: { name: In(careActivities) },
    });
  }

  //TODO: Move this logic to the appropriate service file
  private async findOrCreateBundle(name: string): Promise<Bundle> {
    let bundle = await this.bundleRepo.findOne({
      where: { name: cleanText(name) },
    });

    if (!bundle) {
      bundle = await this.bundleRepo.save(
        this.bundleRepo.create({
          name,
        }),
      );
    }
    return bundle;
  }

  private async saveCareActivity(
    bundleName: string,
    careActivities: {
      name: string;
      activityType: CareActivityType;
      clinicalType: ClinicalType;
      careLocation: Unit | undefined;
    }[],
  ): Promise<void> {
    const bundle = await this.findOrCreateBundle(bundleName);

    await this.careActivityRepo.upsert(
      careActivities.map(({ name, activityType, clinicalType, careLocation }) => {
        return this.careActivityRepo.create({
          name,
          bundle,
          activityType,
          clinicalType,
          careLocations: careLocation ? [careLocation] : [],
        });
      }), ['name']
    );
  }

  //TODO: Move this logic to the appropriate service file
  private async findOrCreateOccupation(name: string): Promise<Occupation> {
    let occupation = await this.occupationRepo.findOne({
      where: { name: cleanText(name) },
    });

    if (!occupation) {
      occupation = await this.occupationRepo.save(
        this.occupationRepo.create({
          name,
          isRegulated: true,
        }),
      );
    }
    return occupation;
  }

  private async saveAllowedActivity(
    occupationName: string,
    activityMap: { [key: string]: Permissions },
    careActivityDBMap: { [key: string]: CareActivity },
  ): Promise<void> {
    const occupation = await this.findOrCreateOccupation(occupationName.trim().replace(/"/g, ''));

    const allowedActivities = Object.entries(activityMap).map(([eachCA, permission]) => {
      return this.allowedActRepo.create({
        occupation,
        permission,
        careActivity: careActivityDBMap[eachCA],
      });
    });

    await this.allowedActRepo
      .createQueryBuilder()
      .insert()
      .into(AllowedActivity)
      .values(allowedActivities)
      .orUpdate({
        conflict_target: ['id'],
        overwrite: ['permission'],
      })
      .execute();
  }
}
