import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Occupation } from './entity/occupation.entity';
import { OccupationService } from './occupation.service';

@ApiTags('occupation')
@Controller('occupations')
export class OccupationController {
  constructor(private occupationService: OccupationService) {}
  @Get()
  getAllOccupations(): Promise<Occupation[]> {
    return this.occupationService.getAllOccupations();
  }
}
