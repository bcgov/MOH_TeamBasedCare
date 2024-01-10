import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Bundle } from './entity/bundle.entity';
import { CareActivity } from './entity/care-activity.entity';
import { BundleRO } from './ro/get-bundle.ro';
import { FindCareActivitiesDto } from './dto/find-care-activities.dto';
import { KeycloakUser, SortOrder } from '@tbcm/common';
import { CareActivitySearchTerm } from './entity/care-activity-search-term.entity';

@Injectable()
export class CareActivityService {
  constructor(
    @InjectRepository(Bundle)
    private readonly bundleRepo: Repository<Bundle>,
    @InjectRepository(CareActivity)
    private readonly careActivityRepo: Repository<CareActivity>,
    @InjectRepository(CareActivitySearchTerm)
    private readonly careActivitySearchTermRepo: Repository<CareActivitySearchTerm>,
  ) {}

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

  async findCareActivities(
    query: FindCareActivitiesDto,
    user: KeycloakUser,
  ): Promise<[CareActivity[], number]> {
    const queryBuilder = this.careActivityRepo.createQueryBuilder('ca');

    // Search logic below
    if (query.searchText) {
      // Non blocking call to save search terms for commonly used terms
      this.createCareActivitySearchTerm(query.searchText, user);

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

  async createCareActivitySearchTerm(term: string, user: KeycloakUser) {
    const createSearchTerm: Partial<CareActivitySearchTerm> = {
      term,
      createdBy: user.sub,
      createdByUsername: user.preferred_username,
      createdByName: user.name,
      createdByEmail: user.email,
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
}
