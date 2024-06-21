import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Bundle } from './entity/bundle.entity';
import { CareActivity } from './entity/care-activity.entity';
import { FindCareActivitiesDto } from './dto/find-care-activities.dto';
import { BundleRO, CareActivitiesCMSFindSortKeys, SortOrder } from '@tbcm/common';
import { CareActivitySearchTerm } from './entity/care-activity-search-term.entity';
import { EditCareActivityDTO } from './dto/edit-care-activity.dto';
import { UnitService } from 'src/unit/unit.service';
import { FindCareActivitiesCMSDto } from './dto/find-care-activities-cms.dto';
import { cleanText } from 'src/common/utils';

@Injectable()
export class CareActivityService {
  constructor(
    @InjectRepository(Bundle)
    private readonly bundleRepo: Repository<Bundle>,
    @InjectRepository(CareActivity)
    private readonly careActivityRepo: Repository<CareActivity>,
    @InjectRepository(CareActivitySearchTerm)
    private readonly careActivitySearchTermRepo: Repository<CareActivitySearchTerm>,
    @Inject(UnitService)
    private readonly unitService: UnitService,
  ) {}

  findOneById(id: string) {
    return this.careActivityRepo.findOneBy({ id });
  }

  async getCareActivitiesByBundlesForCareLocation(careLocationId: string): Promise<BundleRO[]> {
    if (!careLocationId) {
      throw new NotFoundException({ message: 'No Care Location id provided.' });
    }

    const bundles = await this.bundleRepo
      .createQueryBuilder('bundle')
      .leftJoinAndSelect('bundle.careActivities', 'bundle_careActivities')
      .innerJoin(
        'bundle_careActivities.careLocations',
        'bundle_careActivities_careLocations',
        'unit_id = :careLocationId',
        { careLocationId },
      )
      .orderBy('bundle.displayName', 'ASC')
      .addOrderBy('bundle_careActivities.displayName', 'ASC')
      .getMany();

    return bundles.map(bundle => new BundleRO(bundle));
  }

  async getAllBundles(): Promise<Bundle[]> {
    return this.bundleRepo.find({
      relations: ['careActivities'],
      order: {
        name: 'ASC',
      },
    });
  }

  findAllCareActivities(careActivityIds: string[]): Promise<CareActivity[]> {
    return this.careActivityRepo.find({
      where: { id: In(careActivityIds) },
    });
  }

  async findCareActivities(query: FindCareActivitiesDto): Promise<[CareActivity[], number]> {
    const queryBuilder = this.careActivityRepo
      .createQueryBuilder('ca')
      .leftJoinAndSelect('ca.bundle', 'ca_b');

    // Search logic below
    if (query.searchText) {
      // Non blocking call to save search terms for commonly used terms
      this.createCareActivitySearchTerm(query.searchText);

      // add where clause to the query
      queryBuilder.where('ca.displayName ILIKE :name', { name: `%${query.searchText}%` }); // care activity name matching
    }

    // Sort logic below
    const sortOrder = query.sortOrder;

    if (query.sortBy) queryBuilder.orderBy(`ca.${query.sortBy}`, sortOrder as SortOrder); // add sort if requested, else default sort order applies as mentioned in the entity [displayOrder]

    // return the paginated response
    return queryBuilder
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize)
      .getManyAndCount();
  }

  async findCareActivitiesCMS(query: FindCareActivitiesCMSDto): Promise<[CareActivity[], number]> {
    const queryBuilder = this.careActivityRepo
      .createQueryBuilder('ca')
      .leftJoinAndSelect('ca.bundle', 'ca_b')
      .leftJoinAndSelect('ca.updatedBy', 'ca_up')
      .leftJoinAndSelect('ca.careLocations', 'ca_cl');

    // Search logic below
    if (query.searchText) {
      // add where clause to the query
      queryBuilder.where('ca.displayName ILIKE :name', { name: `%${query.searchText}%` }); // care activity name matching
    }

    // filter by care setting
    // default empty string = no filtering
    if (query.careSetting) {
      queryBuilder.andWhere('ca_cl.id = :careSetting', {
        careSetting: query.careSetting,
      });
    }

    // Sort logic below
    const sortOrder = query.sortOrder;

    if (query.sortBy) {
      let orderBy = `ca.${query.sortBy}`;

      if (query.sortBy === CareActivitiesCMSFindSortKeys.BUNDLE_NAME) {
        orderBy = 'ca_b.displayName';
      }

      if (query.sortBy === CareActivitiesCMSFindSortKeys.UPDATED_BY) {
        orderBy = 'ca_up.displayName';
      }

      queryBuilder.orderBy(orderBy, sortOrder as SortOrder); // add sort if requested, else default sort order applies as mentioned in the entity [displayOrder]
    }

    // return the paginated response
    return queryBuilder
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize)
      .getManyAndCount();
  }

  async createCareActivitySearchTerm(term: string) {
    const createSearchTerm: Partial<CareActivitySearchTerm> = {
      term,
    };

    const searchTerm = this.careActivitySearchTermRepo.create(createSearchTerm);

    await this.careActivitySearchTermRepo.save(searchTerm);

    return searchTerm;
  }

  async getCommonSearchTerms() {
    const result: Array<{ word: string; ndoc: number; nentry: number }> = await this
      .careActivitySearchTermRepo.query(`
        SELECT * 
        FROM ts_stat(format($$
          select to_tsvector(term)
          FROM care_activity_search_term
        $$))
        ORDER BY nentry DESC, ndoc DESC, word
        LIMIT 3
    `);

    return result.map(r => r.word);
  }

  async updateCareActivity(id: string, data: EditCareActivityDTO) {
    // validate id exist
    if (!id) throw new NotFoundException();

    // fetch care activity
    const careActivity = await this.findOneById(id);

    // validate care activity exist
    if (!careActivity) {
      throw new NotFoundException({
        message: 'Cannot update care activity: id not found',
        data: { id },
      });
    }

    // deconstruct
    const { bundle: bundleId, careLocations: careLocationIds, ...careActivityLiterals } = data;

    // if bundle is updated, fetch and update entity
    if (bundleId) {
      const bundle = await this.bundleRepo.findOneBy({ id: bundleId });
      if (!bundle) {
        throw new NotFoundException({
          message: 'Cannot update care activity: Bundle not found',
          data: { id: bundleId },
        });
      }

      careActivity.bundle = bundle;
    }

    // if care settings / units / care locations are updated, fetch and update entities
    if (Array.isArray(careLocationIds)) {
      const careLocations = await this.unitService.getManyByIds(careLocationIds);

      // if some care location Ids are invalid, throw error
      if (careLocationIds.length !== careLocations.length) {
        const missingCareLocationIds = careLocationIds.reduce<string[]>((acc, id) => {
          if (!careLocations.map(c => c.id).includes(id)) {
            acc.push(id);
          }

          return acc;
        }, []);

        throw new NotFoundException({
          message: 'Cannot update care activity: Care location(s) not found',
          data: {
            id: missingCareLocationIds,
          },
        });
      }

      // else update
      careActivity.careLocations = careLocations;
    }

    // update entity object for literals
    // Using Object.assign to update the entity object, which will trigger the entity's @BeforeUpdate hook on save
    Object.assign(careActivity, { ...careActivityLiterals });

    // perform update
    await this.careActivityRepo.save(careActivity);
  }

  async removeCareActivity(id: string) {
    // validate id exist
    if (!id) {
      throw new BadRequestException({
        message: 'Cannot delete care activity: id missing',
        data: { id },
      });
    }

    // fetch care activity
    const careActivity = await this.findOneById(id);

    // validate care activity exist
    if (!careActivity) {
      throw new NotFoundException({
        message: 'Cannot delete care activity: id not found',
        data: { id },
      });
    }

    // remove activity
    await this.careActivityRepo.remove(careActivity);
  }

  async upsertCareActivities(partials: Partial<CareActivity>[]) {
    return this.careActivityRepo.upsert(
      partials.map(partial => this.careActivityRepo.create(partial)),
      {
        skipUpdateIfNoValuesChanged: true,
        conflictPaths: ['name'],
      },
    );
  }

  async getManyByNames(names: string[]) {
    return this.careActivityRepo.find({
      where: { name: In(names.map(name => cleanText(name))) },
    });
  }
}
