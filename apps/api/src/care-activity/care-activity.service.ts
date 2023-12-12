import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Bundle } from './entity/bundle.entity';
import { CareActivity } from './entity/care-activity.entity';
import { BundleRO } from './ro/get-bundle.ro';
import { FindCareActivitiesDto } from './dto/find-care-activities.dto';
import { SortOrder } from '@tbcm/common';

@Injectable()
export class CareActivityService {
  constructor(
    @InjectRepository(Bundle)
    private readonly bundleRepo: Repository<Bundle>,
    @InjectRepository(CareActivity)
    private readonly careActivityRepo: Repository<CareActivity>,
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

  async findCareActivities(query: FindCareActivitiesDto): Promise<[CareActivity[], number]> {
    const queryBuilder = this.careActivityRepo.createQueryBuilder('ca');

    // Search logic below
    if (query.searchText) {
      queryBuilder.where('ca.displayName ILIKE :name', { name: `%${query.searchText}%` }); // care activity name matching
    }

    // Sort logic below
    let sortOrder = query.sortOrder;

    if (query.sortBy) queryBuilder.orderBy(`o.${query.sortBy}`, sortOrder as SortOrder); // add sort if requested, else default sort order applies as mentioned in the entity [displayOrder]

    // return the paginated response
    return queryBuilder
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize)
      .getManyAndCount();
  }
}
