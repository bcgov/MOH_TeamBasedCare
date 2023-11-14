import { IsOptional, IsString, IsUrl } from 'class-validator';

export class OccupationRelatedResource {
  @IsString()
  label: string;

  @IsUrl()
  @IsOptional()
  link: string;
}
