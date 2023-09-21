import { IsString } from 'class-validator';

export class AppTokensDTO {
  @IsString()
  access_token!: string;

  @IsString()
  refresh_token!: string;
}
