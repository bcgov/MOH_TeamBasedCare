import { Controller, Get, Param, HttpStatus, Query } from '@nestjs/common';
import { UserGuideService } from './user-guide.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('user-guide')
export class UserGuideController {
  constructor(private readonly userGuideService: UserGuideService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of user guide pdf files' })
  @ApiResponse({ status: HttpStatus.OK })
  findAll() {
    return this.userGuideService.findAll();
  }

  @ApiOperation({ summary: 'Get pre-signed url of a user guide on AWS S3' })
  @Get('/:name/signed-url')
  async getSignedUrl(
    @Param('name') name: string,
    @Query('version') version?: string,
  ): Promise<string> {
    return this.userGuideService.getSignedUrl(name, version);
  }
}
