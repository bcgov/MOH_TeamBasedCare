import { IsOptional, IsString, IsUUID } from 'class-validator';

export class KPIFilterDTO {
  @IsOptional()
  @IsString()
  healthAuthority?: string;

  @IsOptional()
  @IsUUID()
  careSettingId?: string;
}
