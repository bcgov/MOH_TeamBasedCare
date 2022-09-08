import { Controller, Get } from '@nestjs/common';
import { Unit } from 'src/entities/unit.entity';
import { UnitService } from './unit.service';

@Controller('carelocations')
export class UnitController {
  constructor(private unitService: UnitService) {}
  @Get()
  getAllUnits(): Promise<Unit[]> {
    return this.unitService.getAllUnits();
  }
}
