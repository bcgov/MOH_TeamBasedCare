import { Controller, Get } from '@nestjs/common';
import { Unit } from './entity/unit.entity';
import { UnitService } from './unit.service';
import { Roles } from 'nest-keycloak-connect';
import { Role } from '@tbcm/common';

@Controller('carelocations')
@Roles({ roles: [Role.USER] })
export class UnitController {
  constructor(private unitService: UnitService) {}
  @Get()
  getAllUnits(): Promise<Unit[]> {
    return this.unitService.getAllUnits();
  }
}
