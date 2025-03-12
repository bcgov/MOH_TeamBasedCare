import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Occupation } from './entity/occupation.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOccupationsDto } from './dto/find-occupations.dto';
import { EditOccupationDTO } from './dto/edit-occupation.dto';
import { OccupationsFindSortKeys, SortOrder } from '@tbcm/common';
import { cleanText, reverseSortOrder } from 'src/common/utils';

@Injectable()
export class OccupationService {
  constructor(
    @InjectRepository(Occupation)
    private occupationRepository: Repository<Occupation>,
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
}
