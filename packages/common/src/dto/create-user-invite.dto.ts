import { IsArray, IsEmail, IsEnum } from 'class-validator';
import { Role } from '../constants';
import { Transform } from 'class-transformer';

export class CreateUserInviteDTO {
  @IsEmail(undefined, { message: 'Please enter a valid email address' })
  @Transform(({ value }) => value?.trim()?.toLowerCase())
  email!: string;

  @IsArray()
  @IsEnum(Role, { each: true })
  roles!: Role[];
}
