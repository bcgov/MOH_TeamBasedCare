import { Controller, Get, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

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
}
