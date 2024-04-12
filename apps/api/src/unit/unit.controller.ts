import { Controller, Get } from '@nestjs/common';
import { UnitService } from './unit.service';
import { Role, UnitRO } from '@tbcm/common';
import { AllowRoles } from 'src/auth/allow-roles.decorator';

@Controller('carelocations')
@AllowRoles({ roles: [Role.USER] })
export class UnitController {
  constructor(private unitService: UnitService) {}
  @Get()
  async getAllUnits(): Promise<UnitRO[]> {
    const units = await this.unitService.getAllUnits();

    return units.map(unit => new UnitRO(unit));
  }
}
