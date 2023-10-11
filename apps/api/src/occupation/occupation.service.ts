import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Occupation } from './entity/occupation.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OccupationService {
  constructor(
    @InjectRepository(Occupation)
    private occupationrepository: Repository<Occupation>,
  ) {}

  async getAllOccupations(): Promise<Occupation[]> {
    return this.occupationrepository.find();
  }

  findAllOccupation(occupationIds: string[]): Promise<Occupation[]> {
    return this.occupationrepository.find({
      where: { id: In(occupationIds) },
    });
  }
}
