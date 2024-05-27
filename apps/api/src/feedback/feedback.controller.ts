import { Controller, Get, Post, Body } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, Role } from '@tbcm/common';
import { ApiTags } from '@nestjs/swagger';
import { AllowRoles } from 'src/auth/allow-roles.decorator';

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @AllowRoles({ roles: [Role.USER, Role.ADMIN] })
  create(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.create(createFeedbackDto);
  }

  @Get()
  @AllowRoles({ roles: [Role.ADMIN] })
  findAll() {
    return this.feedbackService.findAll();
  }
}
