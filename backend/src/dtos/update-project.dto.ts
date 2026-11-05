import {
  IsDateString,
  IsIn,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PROJECT_STATUSES } from './create-project.dto';

export class UpdateProjectDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Length(2, 120)
  title?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsIn(PROJECT_STATUSES)
  status?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsDateString({ strict: true })
  startDate?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsDateString({ strict: true })
  deadline?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Matches(/^(0|[1-9]\d{0,8})(\.\d{1,2})?$/)
  value?: string;
}
