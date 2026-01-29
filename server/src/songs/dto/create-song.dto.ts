import { IsString, IsOptional, IsArray, IsInt, IsObject, ValidateNested, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class StrummingPatternDto {
  @IsArray()
  @IsString({ each: true })
  strokes!: string[];

  @IsNumber()
  tempo!: number;

  @IsString()
  @IsIn(['1/4', '1/8', '1/8 triplet', '1/16', '1/16 triplet'])
  noteLength!: string;

  @IsOptional()
  @IsString()
  songPart?: string;
}

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

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => StrummingPatternDto)
  strumming_pattern?: StrummingPatternDto;
}
