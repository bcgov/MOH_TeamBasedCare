import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateFeedbackDto } from '@tbcm/common';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
  ) {}

  async create({ text }: CreateFeedbackDto, user: User): Promise<void> {
    await this.feedbackRepository.save({
      text,
      createdBy: user,
    });
  }

  findAll(): Promise<Feedback[]> {
    return this.feedbackRepository.find();
  }
}
