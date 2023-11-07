import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationRO } from '@tbcm/common';
import { FindOccupationsDto } from './dto/find-occupations.dto';
import { Occupation } from './entity/occupation.entity';
import { OccupationService } from './occupation.service';
import { OccupationRO } from './ro/get-occupation.ro';

@ApiTags('occupation')
@Controller('occupations')
@UseInterceptors(ClassSerializerInterceptor)
export class OccupationController {
  constructor(private occupationService: OccupationService) {}
  @Get()
  getAllOccupations(): Promise<Occupation[]> {
    return this.occupationService.getAllOccupations();
  }

  @Get('find')
  async findOccupations(@Query() query: FindOccupationsDto): Promise<PaginationRO<OccupationRO[]>> {
    const [occupations, total] = await this.occupationService.findOccupations(query);
    return new PaginationRO([occupations.map(occupation => new OccupationRO(occupation)), total]);
  }
}
