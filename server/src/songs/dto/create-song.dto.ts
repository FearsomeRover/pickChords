import { IsString, IsOptional, IsArray, IsInt } from 'class-validator';

export class CreateSongDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  artist?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  chord_ids?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tag_ids?: number[];
}
