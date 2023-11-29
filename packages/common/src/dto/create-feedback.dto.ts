import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateFeedbackDto {
  @IsString()
  @MinLength(10, {
    message: 'Please provide more detailed information (at least 10 characters) before submit.',
  })
  @MaxLength(750, {
    message: 'Please trim down information (maximum 750 characters) before submit.',
  })
  @IsNotEmpty({ message: 'Please provide detailed information before submit.' })
  @Transform(({ value }) => value?.trim())
  text!: string;
}
