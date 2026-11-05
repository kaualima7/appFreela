import {
  IsDateString,
  IsIn,
  IsInt,
  IsPositive,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export const PROJECT_STATUSES = [
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

export class CreateProjectDto {
  @IsInt()
  @IsPositive()
  @Max(2147483647)
  clientId: number;

  @IsString()
  @Length(2, 120)
  title: string;

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

  @IsString()
  @Matches(/^(0|[1-9]\d{0,8})(\.\d{1,2})?$/, {
    message:
      'value deve ser texto com valor nao negativo, ate 9 digitos inteiros e 2 casas decimais; exemplo: 1500.50',
  })
  value: string;
}
