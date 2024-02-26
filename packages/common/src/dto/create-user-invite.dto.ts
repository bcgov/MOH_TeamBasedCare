import { IsArray, IsEmail, IsEnum } from 'class-validator';
import { Role } from '../constants';

export class CreateUserInviteDTO {
  @IsEmail()
  email!: string;

  @IsArray()
  @IsEnum(Role, { each: true })
  roles!: Role[];
}
