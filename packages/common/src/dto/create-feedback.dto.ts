import { IsNotEmpty, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 4096)
  @Transform(({ value }) => value?.trim())
  text!: string;
}
