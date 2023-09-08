import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { In, Repository } from 'typeorm';
import { Bundle } from './entity/bundle.entity';
import { CareActivity } from './entity/care-activity.entity';
import { BundleRO } from './ro/get-bundle.ro';

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
      throw new NotFoundException({ message: 'Care Location Not found' });
    }

    const careActivities = await this.careActivityRepo
      .createQueryBuilder('careActivities')
      .innerJoin('careActivities.careLocations', 'careActivities_careLocations')
      .where('careActivities_careLocations.id = :careLocationId', { careLocationId })
      .innerJoinAndSelect('careActivities.bundle', 'careActivities_bundle')
      .getMany();

    const careActivitiesByBundle = _.groupBy(careActivities, 'bundle.id');

    const result: BundleRO[] = [];

    Object.keys(careActivitiesByBundle).forEach(bundleId => {
      // taking zeroth index since result is grouped
      const bundle = careActivitiesByBundle[bundleId][0].bundle;
      
      // grab care activities
      bundle.careActivities = careActivitiesByBundle[bundleId];

      result.push(new BundleRO(bundle));
    });

    return result;
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
}
