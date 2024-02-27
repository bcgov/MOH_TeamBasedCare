import { Role } from '@tbcm/common';
import { IsArray, IsEmail, IsEnum } from 'class-validator';

export class CreateUserInviteDto {
  @IsEmail()
  email: string;

  @IsArray()
  @IsEnum(Role, { each: true })
  roles: Role[];
}
