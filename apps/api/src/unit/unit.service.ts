import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Unit } from 'src/entities/unit.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UnitService {
  constructor(
    @InjectRepository(Unit)
    private unitsRepository: Repository<Unit>,
  ) {}

  async getAllUnits(): Promise<Unit[]> {
    const found = await this.unitsRepository.find();
    return found;
  }
}
