import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Permissions } from 'src/constants';

export class AllowedActivityDTO {
  @IsString()
  id!: string;

  @IsString()
  unitId!: string;

  @IsString()
  occupationId!: string;

  @IsString()
  @IsOptional()
  occupation!: string;

  @IsEnum(Permissions)
  permission!: Permissions;
}
