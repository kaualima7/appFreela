import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { AccountType } from '../generated/prisma/client';

export class CreateUserDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(AccountType)
  accountType?: AccountType;

  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
