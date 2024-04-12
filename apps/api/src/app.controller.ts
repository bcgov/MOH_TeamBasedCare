import {
  Controller,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiProperty, ApiResponse } from '@nestjs/swagger';
import { Role } from '@tbcm/common';
import { AppService } from './app.service';
import { SUCCESS_RESPONSE } from './common/constants';
import { AllowRoles } from './auth/allow-roles.decorator';

class UpdateScriptDTO {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: Express.Multer.File;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({
    summary: 'Get current application version',
  })
  @ApiResponse({ status: HttpStatus.OK })
  @Get('/version')
  getVersion(): object {
    return this.appService.getVersionInfo();
  }

  @ApiOperation({
    summary: 'Throw an internal server exception',
  })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR })
  @Get('/error')
  getError(): object {
    throw new InternalServerErrorException('Breaking uptime');
  }

  @ApiOperation({
    summary: 'Runs script to update care activities',
  })
  @Patch('/update-care-activities')
  @AllowRoles({ roles: [Role.ADMIN] })
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({ type: UpdateScriptDTO })
  @ApiConsumes('multipart/form-data')
  async updateCareActivities(@UploadedFile() file: Express.Multer.File) {
    await this.appService.updateCareActivities(file.buffer);
    return SUCCESS_RESPONSE;
  }

  @ApiOperation({
    summary: 'Runs script to update occupation list',
  })
  @Patch('/update-occupation')
  @AllowRoles({ roles: [Role.ADMIN] })
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({ type: UpdateScriptDTO })
  @ApiConsumes('multipart/form-data')
  async updateOccupations(@UploadedFile() file: Express.Multer.File) {
    await this.appService.updateOccupations(file.buffer);
    return SUCCESS_RESPONSE;
  }

  /**
   * Convenient API to remove master data and allow uploading new set of records
   * Should be removed once data is managed from within the app via Admin Portal
   */
  @ApiOperation({
    summary: 'Removes all the data from the database including the master data',
  })
  @Post('prune-data')
  @AllowRoles({ roles: [Role.ADMIN] })
  async pruneData() {
    await this.appService.pruneData();
    return SUCCESS_RESPONSE;
  }
}
