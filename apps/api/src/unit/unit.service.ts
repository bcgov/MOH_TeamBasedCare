import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Unit } from './entity/unit.entity';
import { In, Repository } from 'typeorm';
import { cleanText } from 'src/common/utils';

@Injectable()
export class UnitService {
  constructor(
    @InjectRepository(Unit)
    private unitsRepository: Repository<Unit>,
  ) {}

  async getAllUnits(): Promise<Unit[]> {
    return this.unitsRepository.find();
  }

  async getUnitsByNames(names: string[]): Promise<Unit[]> {
    return this.unitsRepository.find({ where: { name: In(names.map(name => cleanText(name))) } });
  }

  async saveCareLocations(locations: string[]): Promise<void> {
    this.unitsRepository
      .createQueryBuilder()
      .insert()
      .into(Unit)
      .values(
        locations.map(location => {
          return this.unitsRepository.create({
            name: location,
          });
        }),
      )
      .orIgnore()
      .execute();
  }
}
