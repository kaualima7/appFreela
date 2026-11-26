import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Length, ValidateIf } from 'class-validator';

export class UpdateUserDto {
  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(3, 100)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
