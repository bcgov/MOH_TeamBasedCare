import { IsEnum, IsUUID } from 'class-validator';
import { Permissions } from '@tbcm/common';

export class CreateAllowedActivityDTO {
  @IsEnum(Permissions)
  permission: Permissions;

  @IsUUID()
  careActivity: string;

  @IsUUID()
  occupation: string;
}
