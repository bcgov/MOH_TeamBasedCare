import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, Role } from '@tbcm/common';
import { IRequest } from 'src/common/app-request';
import { ApiTags } from '@nestjs/swagger';
import { AllowRoles } from 'src/auth/allow-roles.decorator';

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @AllowRoles({ roles: [Role.USER, Role.ADMIN] })
  create(@Body() createFeedbackDto: CreateFeedbackDto, @Req() req: IRequest) {
    return this.feedbackService.create(createFeedbackDto, req.user);
  }

  @Get()
  @AllowRoles({ roles: [Role.ADMIN] })
  findAll() {
    return this.feedbackService.findAll();
  }
}
