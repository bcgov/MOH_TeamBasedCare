import {
  Controller,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Patch,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiProperty, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { SUCCESS_RESPONSE } from './common/constants';

class UpdateScriptDTO {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
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
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({ type: UpdateScriptDTO })
  @ApiConsumes('multipart/form-data')
  async updateCareActivities(@UploadedFile() file: any) {
    await this.appService.updateCareActivities(file.buffer);
    return SUCCESS_RESPONSE;
  }
}
