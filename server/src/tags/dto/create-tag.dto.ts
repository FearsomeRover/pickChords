import { IsString, IsOptional, Matches } from 'class-validator';

export class CreateTagDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a valid hex color' })
  color?: string;
}
