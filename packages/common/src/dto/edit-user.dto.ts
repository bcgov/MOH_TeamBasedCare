import { IsArray, IsEnum } from 'class-validator';
import { Role } from '../constants';

export class EditUserDTO {
  @IsArray()
  @IsEnum(Role, { each: true })
  roles!: Role[];
}
