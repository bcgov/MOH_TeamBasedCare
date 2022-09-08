import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Unit } from './entity/unit.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UnitService {
  constructor(
    @InjectRepository(Unit)
    private unitsRepository: Repository<Unit>,
  ) {}

  async getAllUnits(): Promise<Unit[]> {
    return await this.unitsRepository.find();
  }
}
