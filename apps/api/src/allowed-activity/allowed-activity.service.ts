import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AllowedActivity } from './entity/allowed-activity.entity';
import { GetAllowedActivitiesByOccupationDto } from './dto/get-allowed-activities-by-occupation.dto';
import { OccupationalScopeOfPracticeSortKeys, SortOrder } from '@tbcm/common';
import { EditAllowedActivityDTO } from './dto/edit-allowd-activity.dto';

@Injectable()
export class AllowedActivityService {
  constructor(
    @InjectRepository(AllowedActivity)
    private allowedActivityRepository: Repository<AllowedActivity>,
  ) {}

  async findAllowedActivitiesByOccupation(
    occupationId: string,
    query: GetAllowedActivitiesByOccupationDto,
  ) {
    const queryBuilder = this.allowedActivityRepository
      .createQueryBuilder('aa')
      .innerJoinAndSelect('aa.careActivity', 'aa_ca') // join care activity
      .innerJoinAndSelect('aa_ca.bundle', 'aa_ca_b') // add associated bundle
      .innerJoinAndSelect('aa_ca.careLocations', 'aa_ca_cl') // add care settings
      .where('aa.occupation_id = :occupationId', { occupationId });

    // Searching
    if (query.searchText) {
      queryBuilder.andWhere('aa_ca.displayName ILIKE :name', { name: `%${query.searchText}%` }); // care activity name matching
    }

    // Filtering
    if (query.filterByPermission) {
      queryBuilder.andWhere('aa.permission = :permission', {
        permission: query.filterByPermission,
      });
    }

    // Sorting
    const sortBy = query.sortBy as OccupationalScopeOfPracticeSortKeys;

    // if sort by care setting, sort by care setting with bundles and care activities sorted by ASC order
    if (sortBy === OccupationalScopeOfPracticeSortKeys.CARE_SETTING_NAME) {
      queryBuilder.orderBy(`aa_ca_cl.displayName`, query.sortOrder as SortOrder);
      queryBuilder.addOrderBy(`aa_ca_b.displayName`, SortOrder.ASC);
      queryBuilder.addOrderBy(`aa_ca.displayName`, SortOrder.ASC);
    }

    // if sort by bundle, sort by bundle with care activities sorted by ASC order
    if (sortBy === OccupationalScopeOfPracticeSortKeys.BUNDLE_NAME) {
      queryBuilder.orderBy(`aa_ca_b.displayName`, query.sortOrder as SortOrder);
      queryBuilder.addOrderBy(`aa_ca.displayName`, SortOrder.ASC);
    }

    // if sort by care activities, sort by care activities
    if (sortBy === OccupationalScopeOfPracticeSortKeys.CARE_ACTIVITY_NAME) {
      queryBuilder.orderBy(`aa_ca.displayName`, query.sortOrder as SortOrder);
    }

    // if default order, sort by care setting, bundles and care activities in the ASC order
    if (!sortBy) {
      queryBuilder.orderBy(`aa_ca_cl.displayName`, SortOrder.ASC);
      queryBuilder.addOrderBy(`aa_ca_b.displayName`, SortOrder.ASC);
      queryBuilder.addOrderBy(`aa_ca.displayName`, SortOrder.ASC);
    }

    // return the paginated response
    return queryBuilder
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize)
      .getManyAndCount();
  }

  async updateAllowedActivity(id: string, data: EditAllowedActivityDTO) {
    if (!id) throw new NotFoundException();

    const allowedActivity = await this.allowedActivityRepository.findOne(id);

    if (!allowedActivity) {
      throw new NotFoundException({
        message: 'Cannot update allowed activity: id not found',
        data: { id },
      });
    }

    // update entity object for literals
    // Using Object.assign to update the entity object, which if present, will trigger the entity's @BeforeUpdate hook on save
    Object.assign(allowedActivity, { ...data });

    // perform update
    await this.allowedActivityRepository.save(allowedActivity);
  }

  async removeAllowedActivity(id: string) {
    if (!id) throw new NotFoundException();

    const allowedActivity = await this.allowedActivityRepository.findOne(id);

    if (!allowedActivity) throw new NotFoundException();

    return this.allowedActivityRepository.delete(id);
  }
}
