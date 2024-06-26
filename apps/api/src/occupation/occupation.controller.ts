import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationRO, Role } from '@tbcm/common';
import { FindOccupationsDto } from './dto/find-occupations.dto';
import { EditOccupationDTO } from './dto/edit-occupation.dto';
import { Occupation } from './entity/occupation.entity';
import { OccupationService } from './occupation.service';
import { OccupationRO } from './ro/get-occupation.ro';
import { AllowRoles } from 'src/auth/allow-roles.decorator';

@ApiTags('occupation')
@Controller('occupations')
@AllowRoles({ roles: [Role.USER] })
@UseInterceptors(ClassSerializerInterceptor)
export class OccupationController {
  constructor(private occupationService: OccupationService) {}

  @Get()
  @AllowRoles({ roles: [Role.USER, Role.CONTENT_ADMIN] })
  getAllOccupations(): Promise<Occupation[]> {
    return this.occupationService.getAllOccupations();
  }

  @Get('find')
  async findOccupations(@Query() query: FindOccupationsDto): Promise<PaginationRO<OccupationRO[]>> {
    const [occupations, total] = await this.occupationService.findOccupations(query);
    return new PaginationRO([occupations.map(occupation => new OccupationRO(occupation)), total]);
  }

  @Get(':id')
  async getOccupationsById(@Param('id') id: string): Promise<OccupationRO> {
    const occupation = await this.occupationService.findOccupationById(id);

    if (!occupation) {
      throw new NotFoundException();
    }

    return new OccupationRO(occupation);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AllowRoles({ roles: [Role.ADMIN] })
  async updateOccupationById(@Body() data: EditOccupationDTO, @Param('id') id: string) {
    await this.occupationService.updateOccupation(id, data);
  }
}
