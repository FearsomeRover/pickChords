import { IsString, IsArray, IsOptional, IsInt, Min, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class StringDataDto {
  fret!: number | 'x';
  finger?: number;
}

export class CreateChordDto {
  @IsString()
  name!: string;

  @IsArray()
  @ArrayMinSize(6)
  @ArrayMaxSize(6)
  strings!: StringDataDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  start_fret?: number;
}
