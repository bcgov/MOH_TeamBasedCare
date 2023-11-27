import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { KeycloakUser } from '@tbcm/common';
import { Repository } from 'typeorm';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { Feedback } from './entities/feedback.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
  ) {}

  async create({ text }: CreateFeedbackDto, user: KeycloakUser): Promise<void> {
    await this.feedbackRepository.save({
      text,
      createdByName: user.name,
      createdByUsername: user.preferred_username,
      createdByEmail: user.email,
    });
  }

  findAll(): Promise<Feedback[]> {
    return this.feedbackRepository.find();
  }
}
