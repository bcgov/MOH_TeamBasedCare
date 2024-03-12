import { IsEnum } from 'class-validator';
import { Permissions } from '@tbcm/common';

export class EditAllowedActivityDTO {
  @IsEnum(Permissions)
  permission: Permissions;
}
