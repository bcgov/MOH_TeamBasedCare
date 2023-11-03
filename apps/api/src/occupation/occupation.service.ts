import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Occupation } from './entity/occupation.entity';
import { Injectable } from '@nestjs/common';
import { FindOccupationsDto } from './dto/find-occupations.dto';
import { OccupationsFindSortKeys, SortOrder } from '@tbcm/common';

@Injectable()
export class OccupationService {
  constructor(
    @InjectRepository(Occupation)
    private occupationrepository: Repository<Occupation>,
  ) {}

  async getAllOccupations(): Promise<Occupation[]> {
    return this.occupationrepository.find();
  }

  async findOccupations(query: FindOccupationsDto): Promise<[Occupation[], number]> {
    // sort order
    const order: Partial<Record<OccupationsFindSortKeys, SortOrder>> = {};
    if (query.sortBy) {
      order[query.sortBy] = query.sortOrder;
    }

    return this.occupationrepository.findAndCount({
      order,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
  }

  findAllOccupation(occupationIds: string[]): Promise<Occupation[]> {
    return this.occupationrepository.find({
      where: { id: In(occupationIds) },
    });
  }
}
