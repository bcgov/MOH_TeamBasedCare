import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateFeedbackDto {
  @ApiProperty({
    required: true,
    type: String,
    example: 'This is a sample feedback. Everything looks good! Fantastic work.',
  })
  @IsString()
  @Length(0, 4096)
  @Transform(({ value }) => value?.trim())
  text: string;
}
