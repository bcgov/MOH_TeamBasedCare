import { ArrayMinSize, ArrayNotEmpty, IsArray, IsString, MinLength } from 'class-validator';

export class SaveCareActivityDTO {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 Care Activity is required' })
  @ArrayNotEmpty({ message: 'Care Activity is required' })
  @IsString({ each: true })
  @MinLength(1, { each: true })
  careActivities!: string[];
}
