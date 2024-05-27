import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateFeedbackDto } from '@tbcm/common';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
  ) {}

  async create({ text }: CreateFeedbackDto): Promise<void> {
    await this.feedbackRepository.save({
      text,
    });
  }

  findAll(): Promise<Feedback[]> {
    return this.feedbackRepository.find();
  }
}
