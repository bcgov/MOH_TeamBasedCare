import { IsNotEmpty, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  PLANNING_NAME_ERRORS,
  PLANNING_NAME_MAX_LENGTH,
  PLANNING_NAME_MIN_LENGTH,
} from '../constants';

export class RenamePlanningSessionDTO {
  @IsString({ message: PLANNING_NAME_ERRORS.REQUIRED })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: PLANNING_NAME_ERRORS.REQUIRED })
  @Length(PLANNING_NAME_MIN_LENGTH, PLANNING_NAME_MAX_LENGTH, {
    message: ({ value }) =>
      typeof value === 'string' && value.length > PLANNING_NAME_MAX_LENGTH
        ? PLANNING_NAME_ERRORS.TOO_LONG
        : PLANNING_NAME_ERRORS.TOO_SHORT,
  })
  name!: string;
}
