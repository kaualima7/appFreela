import {
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateProfileDto {
  @IsInt()
  @IsPositive()
  userId: number;

  @IsString()
  @Length(2, 120)
  fullName: string;

  @IsOptional()
  @IsDateString({ strict: true })
  birthDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}
