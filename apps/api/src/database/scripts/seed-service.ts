import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { AppLogger } from '../../common/logger.service';
import csv from 'csv-parser';
import { AllowedActivity } from 'src/allowed-activity/entity/allowed-activity.entity';
import { cleanText } from '../../common/utils';
import { Bundle } from '../../care-activity/entity/bundle.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CareActivity } from '../../care-activity/entity/care-activity.entity';
import { Occupation } from 'src/occupation/entity/occupation.entity';
import { Readable } from 'stream';
import { Unit } from '../../unit/entity/unit.entity';
import { UnitService } from 'src/unit/unit.service';
import { CareActivityType, Permissions } from '@tbcm/common';
import { OccupationRelatedResource } from 'src/occupation/dto/occupation-related-resource.dto';

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
    const occupations: {
      name: string;
      displayOrder: number | undefined;
      description: string;
      relatedResources: OccupationRelatedResource[];
      isRegulated: boolean;
    }[] = [];

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
        const displayOrderString = data[headers[1]].trim().replace(/"/g, '');
        const displayOrder = displayOrderString ? Number(displayOrderString) : undefined;
        const description = data[headers[2]].trim().replace(/"/g, '');
        const isRegulated = data[headers[3]].trim().replace(/"/g, '') === 'Regulated';

        // related resources
        const relatedResources = headers.reduce((result, value, index) => {
          if (index < 4) return result; // related resources pair start exist from index 4 and onwards

          // odd index - 5,7,9,.. - contains link
          if (index % 2 === 1) return result; // odd indexes need not be traversed; to be added to result when labels are added

          // even index - 4,6,8,.. - contains labels
          if (index % 2 === 0) {
            const label = data[headers[index]];
            if (!label) return result; // no label = no resource to add

            const link = data[headers[index + 1]];

            result.push({
              label: label?.trim(),
              link: link?.trim() || undefined,
            });
          }

          return result;
        }, [] as OccupationRelatedResource[]);

        occupations.push({ name, displayOrder, description, relatedResources, isRegulated });
      })
      .on('end', async () => {
        // Save the result

        await Promise.all(
          occupations.map(({ name, displayOrder, description, relatedResources, isRegulated }) =>
            this.upsertOccupation({
              name,
              displayOrder,
              description,
              relatedResources,
              isRegulated,
            }),
          ),
        );
      });
  }

  async updateCareActivities(file: Buffer): Promise<void> {
    let headers: string[];
    const bundleVsCareActivity: {
      [key: string]: {
        name: string;
        activityType: CareActivityType;
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
        const activityName = data[headers[0]].trim().replace(/"/g, '');
        const careLocation = 'Acute care medicine';
        careLocations.add(careLocation);

        let activityList: {
          name: string;
          activityType: CareActivityType;
          careLocation: string;
        }[] = [];

        if (bundleName in bundleVsCareActivity) {
          activityList = bundleVsCareActivity[bundleName];
        }
        const activityType = data[headers[2]].trim().replace(/"/g, '');

        activityList.push({ name: activityName, activityType, careLocation });
        bundleVsCareActivity[bundleName] = activityList;
        for (let index = 3; index < headers.length; index++) {
          const e = headers[index];
          let action: string = data[e];
          let allowedAction;
          if (action?.length > 0) {
            action = cleanText(action);
            if (action.includes('y')) {
              allowedAction = Permissions.PERFORM;
            } else if (action.includes('lc')) {
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
          // clinicalType: ClinicalType;
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

  /**
   * @method upsertCareActivity
   * @description Method takes a partial entity, and upserts the entity
   * @explanation Not using inbuilt typeorm method "upsert": It does not update the relations
   */
  private async upsertCareActivity(partialEntity: Partial<CareActivity>): Promise<CareActivity> {
    // throw error if name not provided; @Unique constraint on the entity
    if (!partialEntity.name) {
      throw new BadRequestException({
        message: 'Cannot save Care Activity: Name not found',
      });
    }

    // find care activity with the same name
    let careActivity = await this.careActivityRepo.findOne({
      where: { name: cleanText(partialEntity.name) },
    });

    // if found, and partial activity does not contain the id
    if (careActivity && !partialEntity.id) {
      partialEntity.id = careActivity.id;
    }

    // upsert
    careActivity = await this.careActivityRepo.save(this.careActivityRepo.create(partialEntity));

    return careActivity;
  }

  private async saveCareActivity(
    bundleName: string,
    careActivities: {
      name: string;
      activityType: CareActivityType;
      careLocation: Unit | undefined;
    }[],
  ): Promise<void> {
    const bundle = await this.findOrCreateBundle(bundleName);

    await Promise.all(
      careActivities.map(({ name, activityType, careLocation }) =>
        this.upsertCareActivity({
          name,
          bundle,
          activityType,
          careLocations: careLocation ? [careLocation] : [],
        }),
      ),
    );
  }

  /**
   * @method upsertOccupation
   * @description Method takes a partial entity, and upserts the entity
   * @explanation Not using inbuilt typeorm method "upsert": It does not update the relations
   */
  private async upsertOccupation(partialEntity: Partial<Occupation>): Promise<Occupation> {
    // throw error if name not provided; @Unique constraint on the entity
    if (!partialEntity.name) {
      throw new BadRequestException({
        message: 'Cannot save Occupation: Name not found',
      });
    }

    // find occupation with the same name
    let occupation = await this.occupationRepo.findOne({
      where: { name: cleanText(partialEntity.name) },
    });

    // if found, and partial activity does not contain the id
    if (occupation && !partialEntity.id) {
      partialEntity.id = occupation.id;
    }

    // upsert
    occupation = await this.occupationRepo.save(this.occupationRepo.create(partialEntity));

    return occupation;
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

  /**
   * @method upsertAllowedActivity
   * @description Method takes a partial entity, and upserts the entity
   * @explanation Not using inbuilt typeorm method "upsert": It does not update the relations
   */
  private async upsertAllowedActivity(partialEntity: Partial<AllowedActivity>) {
    // throw error if careActivity or occupation not provided; @Unique constraint on the entity
    if (!partialEntity.careActivity || !partialEntity.occupation) {
      throw new BadRequestException({
        message: 'Cannot save Allowed Activity: CareActivity or Occupation not found',
      });
    }

    // find allowed activity, if exists
    let entity = await this.allowedActRepo.findOne({
      where: { careActivity: partialEntity.careActivity, occupation: partialEntity.occupation },
    });

    // if found, and partial activity does not contain the id
    if (entity && !partialEntity.id) {
      partialEntity.id = entity.id;
    }

    // upsert
    entity = await this.allowedActRepo.save(this.allowedActRepo.create(partialEntity));

    return entity;
  }

  private async saveAllowedActivity(
    occupationName: string,
    activityMap: { [key: string]: Permissions },
    careActivityDBMap: { [key: string]: CareActivity },
  ): Promise<void> {
    const occupation = await this.findOrCreateOccupation(occupationName.trim().replace(/"/g, ''));

    const allowedActivities = Object.entries(activityMap).map(([eachCA, permission]) => {
      return {
        occupation,
        permission,
        careActivity: careActivityDBMap[eachCA],
      };
    });

    await Promise.all(
      allowedActivities.map(allowedActivity => this.upsertAllowedActivity(allowedActivity)),
    );
  }
}
