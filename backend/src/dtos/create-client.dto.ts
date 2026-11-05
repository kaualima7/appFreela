import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  IsInt,
  IsPositive,
  Max,
} from 'class-validator';

export class CreateClientDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(2147483647)
  clientUserId?: number;

  @IsString()
  @Length(2, 120)
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
