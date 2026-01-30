import { IsNumber, IsEnum, Min } from 'class-validator';
import { ProgressStatus } from './add-progress.dto';

export class UpdateProgressDto {
  @IsEnum(ProgressStatus)
  status!: ProgressStatus;

  @IsNumber()
  @Min(0)
  position!: number;
}
