import { Controller, Get } from '@nestjs/common';
import { Unit } from './entity/unit.entity';
import { UnitService } from './unit.service';
import { Role } from '@tbcm/common';
import { AllowRoles } from 'src/auth/allow-roles.decorator';

@Controller('carelocations')
@AllowRoles({ roles: [Role.USER] })
export class UnitController {
  constructor(private unitService: UnitService) {}
  @Get()
  getAllUnits(): Promise<Unit[]> {
    return this.unitService.getAllUnits();
  }
}
