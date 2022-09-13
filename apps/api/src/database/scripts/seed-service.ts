import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppLogger } from '../../common/logger.service';
import csv from 'csv-parser';
import { AllowedActivity } from '../../entities/allowed-activities.entity';
import { cleanText } from '../../common/utils';
import { Bundle } from '../../entities/bundle.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CareActivity } from '../../entities/care-activity.entity';
import { Occupation } from '../../entities/occupation.entity';
import { Permissions } from '../../common/constants';
import { Readable } from 'stream';
import { Unit } from '../../unit/entity/unit.entity';

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
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
  ) {}

  async updateCareActivities(file: Buffer): Promise<void> {
    let headers: string[];
    const bundleVsCareActivity: { [key: string]: string[] } = {};
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
        careLocations.add(data[headers[0]].trim().replace(/"/g, ''));
        let activityList: string[] = [];
        if (bundleName in bundleVsCareActivity) {
          activityList = bundleVsCareActivity[bundleName];
        }
        activityList.push(activityName);
        bundleVsCareActivity[bundleName] = activityList;
        for (let index = 3; index < headers.length; index++) {
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

        await Promise.allSettled(
          Object.entries(bundleVsCareActivity).map(([bundleName, careActivities]) =>
            this.saveCareActivity(bundleName, careActivities),
          ),
        );

        const consolidatedCareActivities: string[] = Object.values(bundleVsCareActivity)
          .map(careActivities => {
            return careActivities.map(each => cleanText(each));
          })
          .flat(1);

        //Delete object to free-up space
        Object.keys(bundleVsCareActivity).forEach(key => {
          delete bundleVsCareActivity[key];
        });

        const careActivityDBMap: { [key: string]: CareActivity } = {};

        (await this.findAllCareActivities(consolidatedCareActivities)).forEach(eachCA => {
          careActivityDBMap[eachCA.name] = eachCA;
        });

        await Promise.allSettled(
          Object.entries(occupationVsCareActivity).map(([occupationName, activityMap]) => {
            this.saveAllowedActivity(occupationName, activityMap, careActivityDBMap);
          }),
        );

        await this.saveCareLocations(Array.from(careLocations));
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

  private async saveCareActivity(bundleName: string, careActivities: string[]): Promise<void> {
    const bundle = await this.findOrCreateBundle(bundleName);

    await this.careActivityRepo
      .createQueryBuilder()
      .insert()
      .into(CareActivity)
      .values(
        careActivities.map(eachCA => {
          return this.careActivityRepo.create({
            name: eachCA,
            bundle,
          });
        }),
      )
      .orIgnore()
      .execute();
  }

  //TODO: Move this logic to the appropriate service file
  private async findOrCreateOccupation(name: string): Promise<Occupation> {
    let occupation = await this.occupationRepo.findOne({
      where: { name },
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

  private async saveCareLocations(locations: string[]): Promise<void> {
    this.unitRepo
      .createQueryBuilder()
      .insert()
      .into(Unit)
      .values(
        locations.map(location => {
          return this.unitRepo.create({
            unitName: location,
          });
        }),
      )
      .orIgnore()
      .execute();
  }
}
