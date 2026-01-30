import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateOccupationDTO,
  EditOccupationCMSDTO,
  OccupationCMSRO,
  PaginationRO,
  Role,
} from '@tbcm/common';
import { FindOccupationsDto } from './dto/find-occupations.dto';
import { FindOccupationsCMSDto } from './dto/find-occupations-cms.dto';
import { EditOccupationDTO } from './dto/edit-occupation.dto';
import { Occupation } from './entity/occupation.entity';
import { OccupationService } from './occupation.service';
import { OccupationRO } from './ro/get-occupation.ro';
import { OccupationDetailRO } from './ro/occupation-detail.ro';
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

  /**
   * CMS endpoint: Find occupations with pagination and search.
   * Returns extended data including regulation status and last editor.
   */
  @Get('cms/find')
  @AllowRoles({ roles: [Role.CONTENT_ADMIN] })
  async findOccupationsCMS(
    @Query() query: FindOccupationsCMSDto,
  ): Promise<PaginationRO<OccupationCMSRO[]>> {
    const [occupations, total] = await this.occupationService.findOccupationsCMS(query);
    return new PaginationRO([
      occupations.map(occupation => new OccupationCMSRO(occupation)),
      total,
    ]);
  }

  /**
   * CMS endpoint: Get occupation details for the edit form.
   * Includes all relations needed to populate scope permissions.
   */
  @Get('cms/:id')
  @AllowRoles({ roles: [Role.CONTENT_ADMIN] })
  async getOccupationCMSById(@Param('id') id: string): Promise<OccupationDetailRO> {
    const occupation = await this.occupationService.getOccupationDetailById(id);

    if (!occupation) {
      throw new NotFoundException({ message: 'Occupation not found', data: { id } });
    }

    return new OccupationDetailRO(occupation);
  }

  /**
   * CMS endpoint: Create a new occupation.
   */
  @Post('cms')
  @AllowRoles({ roles: [Role.CONTENT_ADMIN] })
  async createOccupation(@Body() data: CreateOccupationDTO): Promise<OccupationRO> {
    const occupation = await this.occupationService.createOccupation(data);
    return new OccupationRO(occupation);
  }

  /**
   * CMS endpoint: Update an occupation with scope permissions.
   */
  @Patch('cms/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AllowRoles({ roles: [Role.CONTENT_ADMIN] })
  async updateOccupationCMS(
    @Param('id') id: string,
    @Body() data: EditOccupationCMSDTO,
  ): Promise<void> {
    await this.occupationService.updateOccupationWithScope(id, data);
  }

  /**
   * CMS endpoint: Soft delete an occupation.
   */
  @Delete('cms/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AllowRoles({ roles: [Role.CONTENT_ADMIN] })
  async deleteOccupation(@Param('id') id: string): Promise<void> {
    await this.occupationService.deleteOccupation(id);
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
