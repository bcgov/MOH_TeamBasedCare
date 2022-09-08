import { Controller, Get } from '@nestjs/common';

@Controller('carelocations')
export class UnitController {
  @Get()
  getAllUnits(): string {
    return 'Test';
  }
}
