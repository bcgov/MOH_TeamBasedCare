import { Injectable, NotFoundException } from '@nestjs/common';
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

  async getById(id: string): Promise<Unit> {
    if (!id) throw new NotFoundException({ message: 'Care Location Not found: Invalid Id' });

    const careLocation = await this.unitsRepository.findOneBy({ id });

    if (!careLocation) {
      throw new NotFoundException({ message: 'Care Location Not found' });
    }

    return careLocation;
  }

  async getManyByIds(ids: string[]): Promise<Unit[]> {
    return this.unitsRepository.find({
      where: { id: In(ids) },
    });
  }

  async getAllUnits(): Promise<Unit[]> {
    return this.unitsRepository.find();
  }

  async getUnitsByNames(names: string[]): Promise<Unit[]> {
    return this.unitsRepository.find({
      where: { name: In(names.map(name => cleanText(name))) },
    });
  }

  async saveCareLocations(locations: string[]) {
    return this.unitsRepository.upsert(
      locations.map(name =>
        this.unitsRepository.create({
          name,
        }),
      ),
      ['name'],
    );
  }
}
