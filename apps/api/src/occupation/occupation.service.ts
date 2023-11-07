import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Occupation } from './entity/occupation.entity';
import { Injectable } from '@nestjs/common';
import { FindOccupationsDto } from './dto/find-occupations.dto';

@Injectable()
export class OccupationService {
  constructor(
    @InjectRepository(Occupation)
    private occupationrepository: Repository<Occupation>,
  ) {}

  async getAllOccupations(): Promise<Occupation[]> {
    return this.occupationrepository.find();
  }

  findOccupationById(id: string): Promise<Occupation | undefined> {
    return this.occupationrepository.findOne(id);
  }

  async findOccupations(query: FindOccupationsDto): Promise<[Occupation[], number]> {
    const queryBuilder = this.occupationrepository.createQueryBuilder('o');

    if (query.searchText)
      queryBuilder
        .innerJoin('o.allowedActivities', 'o_aa') // join allowed activities
        .innerJoin('o_aa.careActivity', 'o_aa_ca') // add relation care activity
        .where('o_aa_ca.displayName ILIKE :name', { name: `%${query.searchText}%` }) // care activity name matching
        .orWhere('o.displayName ILIKE :name', { name: `%${query.searchText}%` }) // occupation display name matching
        .orWhere('o.description ILIKE :name', { name: `%${query.searchText}%` }); // occupation description matching

    if (query.sortBy) queryBuilder.orderBy(`o.${query.sortBy}`, query.sortOrder); // add sort if requested, else default sort order applies as mentioned in the entity [displayOrder]

    // return the paginated response
    return queryBuilder
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize)
      .getManyAndCount();
  }

  findAllOccupation(occupationIds: string[]): Promise<Occupation[]> {
    return this.occupationrepository.find({
      where: { id: In(occupationIds) },
    });
  }
}
