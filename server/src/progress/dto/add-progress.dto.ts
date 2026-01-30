import { IsNumber, IsEnum, IsOptional } from 'class-validator';

export enum ProgressStatus {
  WANT_TO_LEARN = 'want_to_learn',
  LEARNING = 'learning',
  PRACTICING = 'practicing',
  MASTERED = 'mastered',
}

export class AddProgressDto {
  @IsNumber()
  songId!: number;

  @IsOptional()
  @IsEnum(ProgressStatus)
  status?: ProgressStatus;
}
