import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Bundle } from './entity/bundle.entity';
import { CareActivity } from './entity/care-activity.entity';
import { FindCareActivitiesDto } from './dto/find-care-activities.dto';
import {
  AllowedActivityRO,
  BundleRO,
  CareActivitiesCMSFindSortKeys,
  CareActivityDetailRO,
  CareActivityRO,
  EditCareActivityDTO,
  SortOrder,
} from '@tbcm/common';
import { CareActivitySearchTerm } from './entity/care-activity-search-term.entity';
import { UnitService } from 'src/unit/unit.service';
import { FindCareActivitiesCMSDto } from './dto/find-care-activities-cms.dto';
import { cleanText } from 'src/common/utils';
import { OccupationService } from 'src/occupation/occupation.service';
import _ from 'lodash';
import { AllowedActivity } from 'src/allowed-activity/entity/allowed-activity.entity';

/** Suffix appended to master template names - stripped for display */
const MASTER_TEMPLATE_SUFFIX = ' - Master';

@Injectable()
export class CareActivityService {
  constructor(
    @InjectRepository(Bundle)
    private readonly bundleRepo: Repository<Bundle>,
    @InjectRepository(CareActivity)
    private readonly careActivityRepo: Repository<CareActivity>,
    @InjectRepository(AllowedActivity)
    private readonly allowedActivityRepo: Repository<AllowedActivity>,
    @InjectRepository(CareActivitySearchTerm)
    private readonly careActivitySearchTermRepo: Repository<CareActivitySearchTerm>,
    @Inject(UnitService)
    private readonly unitService: UnitService,
    private readonly occupationService: OccupationService,
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
      order: {
        name: 'ASC',
      },
    });
  }

  async getAllBundlesWithActivities(): Promise<Bundle[]> {
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

  /**
   * Find care activities for CMS with template-based filtering
   *
   * NOTE: Only shows activities that are selected in at least one visible template.
   * Activities not selected by any template will not appear in results.
   * This is intentional - CMS displays activities "in use" by care setting templates.
   *
   * @param query - Pagination and filter options
   * @param healthAuthority - User's HA, or null to show ALL templates (for admins)
   */
  async findCareActivitiesCMS(
    query: FindCareActivitiesCMSDto,
    healthAuthority: string | null,
  ): Promise<[CareActivityRO[], number]> {
    // Join templates via junction table instead of careLocations
    // This shows which templates have selected each activity
    const queryBuilder = this.careActivityRepo
      .createQueryBuilder('ca')
      .leftJoin(
        'care_setting_template_activities',
        'csta',
        'csta.care_activity_id = ca.id',
      )
      .leftJoin('care_setting_template', 'cst', 'cst.id = csta.care_setting_template_id')
      .leftJoin('ca.bundle', 'ca_b')
      .leftJoin('ca.updatedBy', 'ca_up')
      .select('ca.id', 'ca_id')
      .addSelect('ca.display_name', 'ca_display_name')
      .addSelect('ca.activity_type', 'ca_activity_type')
      .addSelect('ca.clinical_type', 'ca_clinical_type')
      .addSelect('ca_b.display_name', 'ca_b_display_name')
      .addSelect('ca_up.display_name', 'ca_up_display_name')
      .addSelect(
        `STRING_AGG(DISTINCT REPLACE(cst.name, '${MASTER_TEMPLATE_SUFFIX}', ''), ', ' ORDER BY REPLACE(cst.name, '${MASTER_TEMPLATE_SUFFIX}', ''))`,
        'template_names',
      )
      .groupBy('ca.id')
      .addGroupBy('ca.display_name')
      .addGroupBy('ca.activity_type')
      .addGroupBy('ca.clinical_type')
      .addGroupBy('ca_b.display_name')
      .addGroupBy('ca_up.display_name');

    // Apply HA filtering to templates (only show activities in visible templates)
    if (healthAuthority !== null) {
      if (healthAuthority) {
        queryBuilder.andWhere(
          "(cst.health_authority = :ha OR cst.health_authority = 'GLOBAL')",
          { ha: healthAuthority },
        );
      } else {
        // Users without org only see activities in GLOBAL templates
        queryBuilder.andWhere("cst.health_authority = 'GLOBAL'");
      }
    }
    // If null (admin), no HA filter - show all templates

    // Search filter
    if (query.searchText) {
      queryBuilder.andWhere('ca.display_name ILIKE :name', { name: `%${query.searchText}%` });
    }

    // Filter by specific template
    if (query.careSetting) {
      queryBuilder.andWhere('cst.id = :templateId', { templateId: query.careSetting });
    }

    // Sort logic
    const sortOrder = query.sortOrder;

    if (query.sortBy) {
      let orderBy = `ca.${query.sortBy}`;

      if (query.sortBy === CareActivitiesCMSFindSortKeys.BUNDLE_NAME) {
        orderBy = 'ca_b.display_name';
      }

      if (query.sortBy === CareActivitiesCMSFindSortKeys.UPDATED_BY) {
        orderBy = 'ca_up.display_name';
      }
      if (query.sortBy === CareActivitiesCMSFindSortKeys.CARE_SETTING_NAME) {
        orderBy = 'template_names';
      }

      queryBuilder.orderBy(orderBy, sortOrder as SortOrder);
    }

    const all = await queryBuilder.getRawMany();
    const count = all.length;
    const skip = (query.page - 1) * query.pageSize;
    const result = all.slice(skip, skip + query.pageSize).map(raw => ({
      id: raw.ca_id,
      name: raw.ca_display_name,
      activityType: raw.ca_activity_type,
      clinicalType: raw.ca_clinical_type,
      bundleName: raw.ca_b_display_name,
      updatedBy: raw.ca_up_display_name,
      unitName: raw.template_names || '', // Contains template names (not unit names)
      unitId: '', // Deprecated: kept for RO type compatibility, always empty
    }));
    return [result, count];
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

    const { unitId, bundleId, description, name, activityType, allowedActivities } = data;

    // fetch care activity
    const careActivity = await this.careActivityRepo.findOne({
      where: {
        id,
        careLocations: { id: data.unitId },
        allowedActivities: { unit: { id: data.unitId } },
      },
      relations: [
        'bundle',
        'careLocations',
        'allowedActivities',
        'allowedActivities.unit',
        'allowedActivities.occupation',
      ],
    });

    // validate care activity exist
    if (!careActivity) {
      throw new NotFoundException({
        message: 'Cannot update care activity: id not found',
        data: { id },
      });
    }

    if (!careActivity.careLocations.some(u => u.id === unitId)) {
      throw new NotFoundException({
        message: 'Cannot update care activity: not related to the unit',
        data: { id, unitId: data.unitId },
      });
    }

    // if bundle is updated, fetch and update entity
    if (bundleId && careActivity.bundle.id !== bundleId) {
      const bundle = await this.bundleRepo.findOneBy({ id: bundleId });
      if (!bundle) {
        throw new NotFoundException({
          message: 'Cannot update care activity: Bundle not found',
          data: { id: bundleId },
        });
      }
    }

    await this.careActivityRepo.manager.transaction(async manager => {
      await manager.update(CareActivity, id, {
        bundle: { id: bundleId },
        displayName: name,
        description,
        activityType,
      });

      // update allowed activities for the unit
      const currrentAllowedActivityMap = new Map(
        careActivity.allowedActivities.map(aa => [aa.id, aa]),
      );

      // construct allowed activities to be deleted for occupation to be marked 'N'
      const allowedActivitiesToDelete = allowedActivities
        .filter(aa => aa.id && aa.permission === 'N')
        .map(aa => aa.id);
      if (allowedActivitiesToDelete.length) {
        await manager.delete(AllowedActivity, allowedActivitiesToDelete);
      }

      const allowedActivitiesToUpdate = allowedActivities
        .filter(aa => aa.id && aa.permission !== 'N')
        .map(aa => {
          const existing = currrentAllowedActivityMap.get(aa.id);
          if (existing) {
            existing.permission = aa.permission;
            return existing;
          }
        })
        .filter(Boolean) as AllowedActivity[];

      if (allowedActivitiesToUpdate.length) {
        await manager.save(allowedActivitiesToUpdate);
      }

      // new allowed activities
      const allowedActivitiesToCreate = allowedActivities
        .filter(aa => !aa.id && aa.permission !== 'N')
        .map(aa => {
          return this.allowedActivityRepo.create({
            permission: aa.permission,
            occupation: { id: aa.occupationId },
            unit: { id: unitId },
            careActivity: { id },
          });
        });

      if (allowedActivitiesToCreate.length) {
        await manager.save(allowedActivitiesToCreate);
      }
    });
  }

  async removeCareActivity(id: string, unitId: string) {
    // validate id exist
    if (!id) {
      throw new BadRequestException({
        message: 'Cannot delete care activity: id missing',
      });
    }
    if (!unitId) {
      throw new BadRequestException({
        message: 'Cannot delete care activity: unit name missing',
        data: { id },
      });
    }

    // fetch care activity
    const careActivity = await this.careActivityRepo.findOne({
      where: { id },
      relations: ['careLocations'],
    });

    if (!careActivity) {
      throw new NotFoundException({
        message: 'Cannot delete care activity: id not found',
        data: { id },
      });
    }

    if (!careActivity?.careLocations.some(u => u.id === unitId)) {
      throw new NotFoundException({
        message: 'Cannot delete care activity: not related to the unit',
        data: { id, unitId },
      });
    }

    careActivity.careLocations = careActivity.careLocations.filter(u => u.id !== unitId);

    // remove activity
    if (careActivity.careLocations.length) {
      await this.careActivityRepo.save(careActivity);
    } else {
      await this.careActivityRepo.remove(careActivity);
    }
  }

  async saveCareActivities(partials: Partial<CareActivity>[]) {
    return this.careActivityRepo.save(partials);
  }

  async getManyByNames(names: string[]) {
    return this.careActivityRepo.find({
      where: { name: In(names.map(name => cleanText(name))) },
    });
  }

  async getCareActivityById(id: string, unitId: string): Promise<CareActivity | null> {
    const activity = await this.careActivityRepo
      .createQueryBuilder('ca')
      .innerJoinAndSelect('ca.careLocations', 'cl')
      .innerJoinAndSelect('ca.bundle', 'b')
      .leftJoinAndSelect('ca.allowedActivities', 'aa')
      .leftJoinAndSelect('aa.occupation', 'o')
      .leftJoinAndSelect('aa.unit', 'u')
      .where('ca.id = :id', { id })
      .andWhere('cl.id = :unitId', { unitId })
      .getOne();

    if (!activity) {
      throw new BadRequestException({
        message: 'Care activity not found',
        data: { id, unitId },
      });
    }

    activity.allowedActivities = activity.allowedActivities.filter(
      aa => aa.unit && aa.unit.id === unitId,
    );
    return activity;
  }

  async fillMissingAllowedActivities(
    careActivity: CareActivityDetailRO,
  ): Promise<CareActivityDetailRO> {
    const occupations = await this.occupationService.getAllOccupations();
    const missingDisallowedActivities = occupations
      .filter(o => !careActivity.allowedActivities.some(aa => aa.occupation.id === o.id))
      .map(o => ({
        id: '',
        unit: careActivity.careLocation,
        occupation: o,
        permission: 'N',
      })) as AllowedActivityRO[];

    careActivity.allowedActivities = _.sortBy(
      careActivity.allowedActivities.concat(missingDisallowedActivities),
      'occupation.displayName',
    );

    return careActivity;
  }
}
