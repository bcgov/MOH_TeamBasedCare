import { IsArray, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class GetSuggestionsDTO {
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  tempSelectedIds?: string[];

  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  pageSize?: number;
}
