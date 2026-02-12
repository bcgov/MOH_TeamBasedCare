/**
 * Occupation Service
 *
 * Handles all occupation-related business logic including:
 * - CRUD operations for occupations
 * - CMS-specific queries with pagination and search
 * - Scope permissions management (via AllowedActivity repository)
 *
 * @module occupation/occupation.service
 */

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Occupation } from './entity/occupation.entity';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FindOccupationsDto } from './dto/find-occupations.dto';
import { FindOccupationsCMSDto } from './dto/find-occupations-cms.dto';
import { EditOccupationDTO } from './dto/edit-occupation.dto';
import {
  CreateOccupationDTO,
  EditOccupationCMSDTO,
  OccupationsCMSFindSortKeys,
  OccupationsFindSortKeys,
  SortOrder,
} from '@tbcm/common';
import { cleanText, reverseSortOrder } from 'src/common/utils';
import { AllowedActivity } from '../allowed-activity/entity/allowed-activity.entity';
import { CareSettingTemplateService } from '../unit/care-setting-template.service';

/**
 * Service for managing occupations and their scope permissions.
 */
@Injectable()
export class OccupationService {
  constructor(
    @InjectRepository(Occupation)
    private occupationRepository: Repository<Occupation>,
    @InjectRepository(AllowedActivity)
    private allowedActivityRepository: Repository<AllowedActivity>,
    private careSettingTemplateService: CareSettingTemplateService,
  ) {}

  async getAllOccupations(): Promise<Occupation[]> {
    return this.occupationRepository.find();
  }

  findOccupationById(id: string) {
    return this.occupationRepository.findOneBy({ id });
  }

  async findOccupations(query: FindOccupationsDto): Promise<[Occupation[], number]> {
    const queryBuilder = this.occupationRepository.createQueryBuilder('o');

    // Search logic below
    if (query.searchText) {
      queryBuilder
        .innerJoin('o.allowedActivities', 'o_aa') // join allowed activities
        .innerJoin('o_aa.careActivity', 'o_aa_ca') // add relation care activity
        .where('o_aa_ca.displayName ILIKE :name', { name: `%${query.searchText}%` }) // care activity name matching
        .orWhere('o.displayName ILIKE :name', { name: `%${query.searchText}%` }) // occupation display name matching
        .orWhere('o.description ILIKE :name', { name: `%${query.searchText}%` }); // occupation description matching
    }

    // Sort logic below
    let sortOrder = query.sortOrder;

    if (query.sortBy === OccupationsFindSortKeys.IS_REGULATED && sortOrder) {
      /**
       * Bug Fix: https://eydscanada.atlassian.net/browse/TBCM-165: Sorting on regulation status is not correct
       * Details: Key("isRegulated") in database is a boolean; and will always sort based on True/false and not Regulated/Unregulated key as in FE
       * Solution: Modify the sort order to reflect correct sort values based on FE key rather than the boolean
       * Current Sort order: ASC => False(unregulated) followed by True(regulated); DESC => True followed by False
       * Expected sort order: ASC => Regulated followed by Unregulated; DESC => Unregulated followed by Regulated
       * Fix: Reverse the order provided by the user
       */
      sortOrder = reverseSortOrder(query.sortOrder as SortOrder);
    }

    if (query.sortBy) queryBuilder.orderBy(`o.${query.sortBy}`, sortOrder as SortOrder); // add sort if requested, else default sort order applies as mentioned in the entity [displayOrder]

    // return the paginated response
    return queryBuilder
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize)
      .getManyAndCount();
  }

  findAllOccupation(occupationIds: string[]): Promise<Occupation[]> {
    return this.occupationRepository.find({
      where: { id: In(occupationIds) },
    });
  }

  async updateOccupation(id: string, data: EditOccupationDTO) {
    if (!id) throw new NotFoundException();

    const occupation = await this.findOccupationById(id);

    if (!occupation) {
      throw new NotFoundException({
        message: 'Cannot update occupation: id not found',
        data: { id },
      });
    }

    // update entity object for literals
    // Using Object.assign to update the entity object, which will trigger the entity's @BeforeUpdate hook on save
    Object.assign(occupation, { ...data });

    // perform update
    await this.occupationRepository.save(occupation);
  }

  async createByDisplayNames(displayNames: string[]): Promise<Occupation[]> {
    return this.occupationRepository.save(
      displayNames
        .map(displayName => displayName.replace(/"/g, ''))
        .map(displayName => ({
          displayName,
          name: cleanText(displayName),
          isRegulated: true,
        })),
    );
  }

  /**
   * Find occupations for CMS with pagination, search, and sort.
   * Includes the updatedBy relation for displaying last editor info.
   *
   * @param query - Query parameters (search, pagination, sort)
   * @returns Tuple of [occupations array, total count]
   */
  async findOccupationsCMS(query: FindOccupationsCMSDto): Promise<[Occupation[], number]> {
    const queryBuilder = this.occupationRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.updatedBy', 'updatedBy');

    // Search by name or description
    if (query.searchText) {
      queryBuilder.where('(o.displayName ILIKE :search OR o.description ILIKE :search)', {
        search: `%${query.searchText}%`,
      });
    }

    // Sort logic
    let sortOrder = query.sortOrder;

    if (query.sortBy === OccupationsCMSFindSortKeys.IS_REGULATED && sortOrder) {
      // Reverse sort order for boolean field (see findOccupations for explanation)
      sortOrder = reverseSortOrder(query.sortOrder as SortOrder);
    }

    if (query.sortBy) {
      queryBuilder.orderBy(`o.${query.sortBy}`, sortOrder as SortOrder);
    } else {
      // Default sort by displayName
      queryBuilder.orderBy('o.displayName', 'ASC');
    }

    return queryBuilder
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize)
      .getManyAndCount();
  }

  /**
   * Get occupation with all details for the CMS edit form.
   * Loads all related entities needed to display scope permissions:
   * - allowedActivities with careActivity, bundle, and unit relations
   *
   * @param id - Occupation UUID
   * @returns Occupation with relations or null if not found
   */
  async getOccupationDetailById(id: string): Promise<Occupation | null> {
    return this.occupationRepository.findOne({
      where: { id },
      relations: [
        'updatedBy',
        'allowedActivities',
        'allowedActivities.careActivity',
        'allowedActivities.careActivity.bundle',
        'allowedActivities.unit',
      ],
    });
  }

  /**
   * Create a new occupation with optional scope permissions.
   *
   * Steps:
   * 1. Validate name uniqueness (case-insensitive)
   * 2. Create the occupation entity
   * 3. Create AllowedActivity records for scope permissions
   *
   * @param data - Create occupation DTO with optional scope permissions
   * @returns The created occupation
   * @throws BadRequestException if name already exists
   */
  async createOccupation(data: CreateOccupationDTO): Promise<Occupation> {
    // Check uniqueness of name (case-insensitive)
    const cleanedName = cleanText(data.name);
    const existing = await this.occupationRepository.findOne({
      where: { name: cleanedName },
    });

    if (existing) {
      throw new BadRequestException('An occupation with this name already exists.');
    }

    // Create occupation
    const occupation = this.occupationRepository.create({
      name: data.name,
      description: data.description,
      isRegulated: data.isRegulated,
      relatedResources: data.relatedResources,
    });

    const saved = await this.occupationRepository.save(occupation);

    // Create scope permissions if provided
    if (data.scopePermissions?.length) {
      const entities = data.scopePermissions.map(sp =>
        this.allowedActivityRepository.create({
          occupation: { id: saved.id },
          careActivity: { id: sp.careActivityId },
          permission: sp.permission,
        }),
      );
      await this.allowedActivityRepository.save(entities);

      // Sync permissions to all care setting templates
      await this.careSettingTemplateService.syncOccupationToAllTemplates(
        saved.id,
        data.scopePermissions,
      );
    }

    return saved;
  }

  /**
   * Update occupation with scope permissions for CMS.
   *
   * Steps:
   * 1. Validate occupation exists
   * 2. Validate name uniqueness if name is being changed
   * 3. Update occupation fields (partial update)
   * 4. Upsert scope permissions (AllowedActivity records)
   *
   * @param id - Occupation UUID
   * @param data - Edit occupation DTO (all fields optional)
   * @throws NotFoundException if occupation not found
   * @throws BadRequestException if new name already exists
   */
  async updateOccupationWithScope(id: string, data: EditOccupationCMSDTO): Promise<void> {
    const occupation = await this.findOccupationById(id);

    if (!occupation) {
      throw new NotFoundException({
        message: 'Occupation not found',
        data: { id },
      });
    }

    // Check name uniqueness if name is being changed
    if (data.name && data.name !== occupation.displayName) {
      const cleanedName = cleanText(data.name);
      const existing = await this.occupationRepository.findOne({
        where: { name: cleanedName },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException('An occupation with this name already exists.');
      }
    }

    // Update occupation fields
    Object.assign(occupation, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isRegulated !== undefined && { isRegulated: data.isRegulated }),
      ...(data.relatedResources !== undefined && {
        relatedResources: data.relatedResources,
      }),
    });

    await this.occupationRepository.save(occupation);

    // Update scope permissions if provided
    // Delete existing permissions first, then insert new ones
    // This ensures removed permissions are deleted from the database
    if (data.scopePermissions !== undefined) {
      await this.allowedActivityRepository.delete({
        occupation: { id },
      });

      if (data.scopePermissions.length > 0) {
        const entities = data.scopePermissions.map(sp =>
          this.allowedActivityRepository.create({
            occupation: { id },
            careActivity: { id: sp.careActivityId },
            permission: sp.permission,
          }),
        );
        await this.allowedActivityRepository.save(entities);
      }

      // Sync permissions to all care setting templates
      await this.careSettingTemplateService.syncOccupationToAllTemplates(id, data.scopePermissions);
    }
  }

  /**
   * Delete an occupation (soft delete).
   *
   * Sets the deletedAt timestamp rather than permanently removing the record.
   * Also removes all permissions for this occupation from care setting templates.
   * AllowedActivities remain in the database but the occupation won't appear
   * in queries due to TypeORM's automatic soft delete filtering.
   *
   * @param id - Occupation UUID
   * @throws NotFoundException if occupation not found
   */
  async deleteOccupation(id: string): Promise<void> {
    const occupation = await this.findOccupationById(id);

    if (!occupation) {
      throw new NotFoundException({
        message: 'Occupation not found',
        data: { id },
      });
    }

    // Remove from all care setting templates before soft delete
    // (FK cascade only works for hard delete, not soft delete)
    await this.careSettingTemplateService.removeOccupationFromAllTemplates(id);

    await this.occupationRepository.softDelete(id);
  }
}
