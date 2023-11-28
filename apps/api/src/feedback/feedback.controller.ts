import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { Roles } from 'nest-keycloak-connect';
import { CreateFeedbackDto, Role } from '@tbcm/common';
import { IRequest } from 'src/common/app-request';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  create(@Body() createFeedbackDto: CreateFeedbackDto, @Req() req: IRequest) {
    return this.feedbackService.create(createFeedbackDto, req.user);
  }

  @Get()
  @Roles({ roles: [Role.ADMIN] })
  findAll() {
    return this.feedbackService.findAll();
  }
}
