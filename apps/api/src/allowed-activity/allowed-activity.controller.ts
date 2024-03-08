import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationRO, Role } from '@tbcm/common';
import { AllowedActivityService } from './allowed-activity.service';
import { GetAllowedActivitiesByOccupationDto } from './dto/get-allowed-activities-by-occupation.dto';
import { GetAllowedActivitiesByOccupationRO } from './ro/get-allowed-activities-by-occupation.ro';
import { AllowRoles } from 'src/auth/allow-roles.decorator';
import { EditAllowedActivityDTO } from './dto/edit-allowd-activity.dto';

@ApiTags('allowedActivities')
@Controller('allowedActivities')
@AllowRoles({ roles: [Role.USER] })
@UseInterceptors(ClassSerializerInterceptor)
export class AllowedActivityController {
  constructor(private allowedActivityService: AllowedActivityService) {}

  @Get('/occupation/:id')
  async getAllowedActivitiesByOccupation(
    @Param('id') occupationId: string,
    @Query() query: GetAllowedActivitiesByOccupationDto,
  ): Promise<PaginationRO<GetAllowedActivitiesByOccupationRO[]>> {
    const [allowedActivities, total] =
      await this.allowedActivityService.findAllowedActivitiesByOccupation(occupationId, query);

    return new PaginationRO([
      allowedActivities.map(
        allowedActivity => new GetAllowedActivitiesByOccupationRO(allowedActivity),
        total,
      ),
      total,
    ]);
  }

  @Patch('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AllowRoles({ roles: [Role.ADMIN] })
  async updateAllowedActivityById(@Body() data: EditAllowedActivityDTO, @Param('id') id: string) {
    await this.allowedActivityService.updateAllowedActivity(id, data);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AllowRoles({ roles: [Role.ADMIN] })
  async deleteAllowedActivityById(@Param('id') id: string) {
    await this.allowedActivityService.remove(id);
  }
}
