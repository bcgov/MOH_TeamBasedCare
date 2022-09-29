import { ArrayMinSize, ArrayNotEmpty, IsArray, IsString, MinLength } from 'class-validator';

export class SaveOccupationDTO {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 Occupation is required' })
  @ArrayNotEmpty({ message: 'At least 1 Occupation is required' })
  @IsString({ each: true })
  @MinLength(1, { each: true })
  occupation!: string[];
}
